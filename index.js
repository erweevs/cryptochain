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

const isDevelopment = process.env.ENV === 'development';

// determine the Redis URL
const REDIS_URL = isDevelopment ? 
    'redis://127.0.0.1:6379' :
    'redis://blockchain-test.redis.cache.windows.net:6380,password=jfq7MSgybryb0E6c9u78mYmbfjuQm49D4DpG9z+5MQc=,ssl=True,abortConnect=False';

    // Default port
const DEFAULT_PORT = 3000;

// Get the address of the root node
const ROOT_NODE_ADDRESS = isDevelopment ?
    `http://localhost:${DEFAULT_PORT}` : 
    'https://blooming-plains-79380.herokuapp.com';

// Create the local app
const app = express();

// Main Blockchain for app
const blockchain = new Blockchain();
const transactionPool = new TransactionPool();
const wallet = new Wallet();
const pubsub = new PubSub({blockchain, transactionPool, redisUrl: REDIS_URL});
const transactionMiner = new TransactionMiner({
    blockchain,
    transactionPool,
    wallet,
    pubsub
});

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

// ====== seed the backend with dev data
if(isDevelopment){
    const walletFoo = new Wallet();
    const walletBar = new Wallet();

    const generateWalletTransaction = ({wallet, recipient, amount}) => {
        const transaction = wallet.createTransaction({
            recipient,
            amount,
            chain: blockchain.chain
        });

        transactionPool.setTransaction(transaction);
    };

    const walletAction = () => generateWalletTransaction({
        wallet: wallet,
        recipient: walletFoo.publicKey,
        amount: 5
    });

    const walletFooAction = () => generateWalletTransaction({
        wallet: walletFoo,
        recipient: walletBar.publicKey,
        amount: 10
    });

    const walletBarAction = () => generateWalletTransaction({
        wallet: walletBar,
        recipient: wallet.publicKey,
        amount: 15
    });

    for(let i = 0; i < 10; i++){
        if(i % 3 === 0){
            walletAction();
            walletFooAction();
        } else if(i % 3 === 1){
            walletAction();
            walletBarAction();
        }else{
            walletFooAction();
            walletBarAction();
        }

        transactionMiner.mineTransaction();
    }
}
// ========

let PEER_PORT;

if(process.env.GENERATE_PEER_PORT === 'true'){
    PEER_PORT = DEFAULT_PORT + (Math.ceil(Math.random() * 1000));
}

const PORT = process.env.PORT || PEER_PORT || DEFAULT_PORT;

// Tell the app to listen to incoming requests
app.listen(PORT, () => {
    console.log(`App listening at localhost:${PORT}`);

    if(PORT !== DEFAULT_PORT){
        syncWithRootState();
    }
});