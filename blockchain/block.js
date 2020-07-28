// Use the library hex-to-binary v 1.0.1
const hexToBinary = require('hex-to-binary');
// Import the Genesis data
const {GENESIS_DATA, MINE_RATE} = require('../config');
// Import the crypto-hash function
const {cryptoHash} = require('../utilities');

// Creating the Block class
class Block{
    constructor({timestamp, lastHash, hash, data, nonce, difficulty}){
        this.timestamp = timestamp;
        this.lastHash = lastHash;
        this.hash = hash;
        this.data = data;
        this.nonce = nonce;
        this.difficulty = difficulty;
    }

    // Invoking the Genesis data
    static genesis(){
        return new this(GENESIS_DATA);
    }

    // Creating the mineBlock function
    static mineBlock({lastBlock, data}){
        const lastHash = lastBlock.hash;
        let hash, timestamp;     
        let {difficulty} = lastBlock;
        let nonce = 0;

        do{
            nonce++;
            timestamp = Date.now();
            difficulty = Block.adjustDifficulty({originalBlock: lastBlock, timestamp});
            hash = cryptoHash(timestamp, lastHash, data, nonce, difficulty);
        }while(hexToBinary(hash).substring(0, difficulty) !== '0'.repeat(difficulty));

        return new this({
            timestamp,
            lastHash,
            data,
            difficulty,
            nonce,
            hash
        });
    }

    static adjustDifficulty({originalBlock, timestamp}){
        const {difficulty} = originalBlock;
        const difference = timestamp - originalBlock.timestamp;

        // Cater for the case where the difficulty < 1
        if(difficulty < 1){
            return 1;
        }

        // Lower the difficulty if the Block was mined too slowly
        if(difference > MINE_RATE){
            return difficulty - 1;
        }

        // Up the difficulty if the Block was mined too quickly
        return difficulty + 1;
    }
}

// Export the Block class to be used by other classes
module.exports = Block;