// Using the express module v 4.16.3
const express = require('express');
// Using request v 2.88.0
const request = require('request');
// Using body-parser v 1.18.3
const bodyParser = require('body-parser');
const path = require('path');

const Blockchain = require('./blockchain');
const PubSub = require('./app/pubsub');
const TransactionPool = require('./wallet/transaction-pool');
const Wallet = require('./wallet');
const TransactionMiner = require('./app/transaction-miner');

// Create the local app
const app = express();

// Main Blockchain for app
const blockchain = new Blockchain();
const transactionPool = new TransactionPool();
const wallet = new Wallet();
const pubsub = new PubSub({blockchain, transactionPool});
const transactionMiner = new TransactionMiner({
    blockchain,
    transactionPool,
    wallet,
    pubsub
});

// Default port
const DEFAULT_PORT = 3000;

// Get the address of the root node
const ROOT_NODE_ADDRESS = `http://localhost:${DEFAULT_PORT}`;

// Configure express to use the body-parser middleware
app.use(bodyParser.json());

// add middleware to serve the front end
app.use(express.static(path.join(__dirname, 'client/dist')));

// Create the api end points
const getAllBlocksAPI = '/api/blocks';
const mineBlockAPI = '/api/mine';
const transactAPI = '/api/transact';
const transactionPoolMapAPI = '/api/transaction-pool-map';
const mineTransactionsAPI = '/api/mine-transactions';
const walletInfoAPI = '/api/wallet-info';

// Define a GET request to get all the blocks in the Blockchain
// req = request, res = response
app.get(getAllBlocksAPI, (req, res) => {
    res.json(blockchain.chain);
});

// Add POST method to mine a new block to the chain
app.post(mineBlockAPI, (req, res) => {
    const {data} = req.body;

    // Push block to the chain 
    blockchain.addBlock({data});

    // Broadcast the chain
    pubsub.broadcastChain();

    // Display the blocks currently in the chain
    res.redirect(getAllBlocksAPI);
});

// POST request to add a transaction to the transaction pool
app.post(transactAPI, (req, res) => {
    const {amount, recipient} = req.body;
    let transaction = transactionPool.existingTransaction({inputAddress: wallet.publicKey});

    try{
        // First see if the transaction already exists
        if(transaction){
            transaction.update({senderWallet: wallet, recipient, amount});
        }else{
            transaction = wallet.createTransaction({
                recipient: recipient, 
                amount: amount,
                chain: blockchain.chain
            });
        }
        
    } catch(error){
        return res.status(400).json({type: 'error', message: error.message});
    }

    transactionPool.setTransaction(transaction);

    // Notify all parties about the transaction that just happend
    pubsub.broadcastTransaction(transaction);

    //console.log('transactionPool:', transactionPool);
    
    res.json({type: 'success', transaction});
});

// GET request to get the data in the Transaction Pool map
app.get(transactionPoolMapAPI, (req, res) => {
    res.json(transactionPool.transactionMap);
});

// GET request to mine a transaction
app.get(mineTransactionsAPI, (req, res) => {
    // mine the transactions
    transactionMiner.mineTransaction();

    // redirect user to see all the blocks
    res.redirect(getAllBlocksAPI);
});

// GET request to get your Wallet info
app.get(walletInfoAPI, (req, res) => {
    const address = wallet.publicKey;
    res.json({
        address: address,
        balance: Wallet.calculateBalance({
            chain: blockchain.chain,
            address: address
        })
    });


});

// GEt the index.html file
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/dist/index.html'));
});

// Method to sync up the chain on different ports, on startup
const syncWithRootState = () => {
    // Sync all the Blocks on the network
    const requestUrl = `${ROOT_NODE_ADDRESS}${getAllBlocksAPI}`;
    request({url: requestUrl}, (error, response, body) => {
        if(!error && response.statusCode === 200){
            const rootChain = JSON.parse(body);

            console.log('replace chain on a sync with ', rootChain);
            blockchain.replaceChain(rootChain);
        }
    });

    // Sync all the Transactions on the Network
    request({url: `${ROOT_NODE_ADDRESS}${transactionPoolMapAPI}`}, (error, response, body) => {
        if(!error && response.statusCode === 200){
            const rootTransactionPoolMap = JSON.parse(body);

            console.log('replace transaction pool map on a sync with ', rootTransactionPoolMap);
            transactionPool.setMap(rootTransactionPoolMap);
        }
    });
};

let PEER_PORT;

if(process.env.GENERATE_PEER_PORT === 'true'){
    PEER_PORT = DEFAULT_PORT + (Math.ceil(Math.random() * 1000));
}

const PORT = PEER_PORT || DEFAULT_PORT;

// Tell the app to listen to incoming requests
app.listen(PORT, () => {
    console.log(`App listening at localhost:${PORT}`);

    if(PORT !== DEFAULT_PORT){
        syncWithRootState();
    }
});