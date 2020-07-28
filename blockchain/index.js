const Block = require('./block');
const {cryptoHash} = require('../utilities');
const { REWARD_INPUT, MINING_REWARD } = require('../config');
const Transaction = require('../wallet/transaction');
const Wallet = require('../wallet');

class Blockchain{
    constructor(){
        this.chain = [Block.genesis()];
    }

    addBlock({data}){
        const newBlock = Block.mineBlock({
            lastBlock: this.chain[this.chain.length -1],
            data
        });

        this.chain.push(newBlock);
    }

    replaceChain(chain, validateTransactions, onSuccess){
        // check if the incoming chain is longer than current chain
        if(chain.length <= this.chain.lengt){
            console.error('The incomming chain must be longer');
            return;
        }

        if(!Blockchain.isVaildChain(chain)){
            console.error('The incoming chain must be valid');
            return;
        }

        // check the transaction status before replacing the chain
        if(validateTransactions && !this.validTransactionData({chain})){
            console.error('The incoming chain has invalid data.');
            return;
        }

        if(onSuccess){onSuccess();}

        console.log('Replacing chain with: ', chain);
        this.chain = chain;
    }

    validTransactionData({chain}){
        // start at 1 to skip the Genesis block
        for(let i = 1; i < chain.length; i ++){
            const block = chain[i];
            let rewardTransactionCount = 0;

            // Using the JavaScript Set() functionality
            const transactionSet = new Set();

            for(let transaction of block.data){
                if(transaction.input.address === REWARD_INPUT.address){
                    rewardTransactionCount += 1;

                    // check if transaction was already rewarded
                    if(rewardTransactionCount > 1){
                        console.error('Miner rewards exceed limit');
                        return false;
                    }

                    // check if the miner's reward is a valid reward amount
                    if(Object.values(transaction.outputMap)[0] !== MINING_REWARD){
                        console.error('Miner reward is invalid');
                        return false;
                    }
                }
                else{
                    if(!Transaction.validTransaction(transaction)){
                        console.error('Invalid Transaction');
                        return false;
                    }

                    const trueBalance = Wallet.calculateBalance({
                        chain: this.chain,
                        address: transaction.input.address
                    });

                    if(transaction.input.amount !== trueBalance){
                        console.error('Invalid input amount');
                        return false;
                    }

                    // check for identical transactions
                    if(transactionSet.has(transaction)){
                        console.error('An identical transaction apperas more than once in the block');
                        return false;
                    }else{
                        // add the transaction to the set
                        transactionSet.add(transaction);
                    }
                }
            }
        }

        return true;
    };

    static isVaildChain(chain){
        if(JSON.stringify(chain[0]) !== JSON.stringify(Block.genesis())){
            return false;
        }

        for(let i = 1; i < chain.length; i++){
            const {timestamp, lastHash, hash, nonce, difficulty ,data} = chain[i];
            const actualLastHash = chain[i-1].hash;
            const lastDifficulty = chain[i - 1].difficulty;

            if(lastHash !== actualLastHash){
                return false;
            }

            const validatedHash = cryptoHash(timestamp, lastHash, data, nonce, difficulty);

            if(hash !== validatedHash){
                return false;
            }

            // Check for jumped difficulty
            // Math.abs to cater for the case where the difficulty is either
            // raised or lowered
            if(Math.abs(lastDifficulty - difficulty) > 1){
                return false;
            }
        }

        return true;
    }
}

module.exports = Blockchain;