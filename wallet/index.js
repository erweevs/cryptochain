const {STARTING_BALANCE} = require('../config');
//Invoke the Elliptic Curve index module
const {ec, cryptoHash} = require('../utilities');
const Transaction = require('./transaction');

class Wallet{
    constructor(){
        this.balance = STARTING_BALANCE;

        // Get the Public and Private keys
        this.keyPair = ec.genKeyPair();

        // Assign the public key
        this.publicKey = this.keyPair.getPublic().encode('hex');
    }

    sign(data){
        return this.keyPair.sign(cryptoHash(data));
    }

    createTransaction({recipient, amount, chain}){
        if(chain){
            this.balance = Wallet.calculateBalance({
                chain: chain,
                address: this.publicKey
            });
        }

        if(amount > this.balance){
            throw new Error('Amount exceeds balance');
        }

        return new Transaction({
            senderWallet: this,
            recipient,
            amount
        });
    }

    static calculateBalance({chain, address}){
        let hasConductedTransaction = false;
        let outputsTotal = 0;

        // stopping the loop at 1 to skip the Genesis block
        // starting the loop at the last block (length - 1)
        for(let i = chain.length - 1; i > 0; i--){
            const block = chain[i];

            for(let transaction of block.data){
                if(transaction.input.address === address){
                    hasConductedTransaction = true;
                }

                const addressOutput = transaction.outputMap[address];

                //only sum the values if the addressOutput has values
                if(addressOutput){
                    outputsTotal += addressOutput;
                }
            }

            if(hasConductedTransaction){
                break;
            }
        }

        return hasConductedTransaction ? outputsTotal : STARTING_BALANCE + outputsTotal;
    }
}

module.exports = Wallet;