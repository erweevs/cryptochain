const Blockchain = require('../blockchain');

const blockchain = new Blockchain();
blockchain.addBlock({data: 'initial'});

// Log the 1st block
console.log('First Block: ', blockchain.chain[blockchain.chain.length - 1]);

let prevTimestamp, nextTimestamp, nextBlock, timeDiff, average;

const times = [];

// Mine 10 000 blocks and record the times taken to mine said blocks
for(let i = 0; i < 10000; i++){
    // Get the timestamp of the last block added to the chain
    prevTimestamp = blockchain.chain[blockchain.chain.length - 1].timestamp;

    // Add a new block to the chain
    blockchain.addBlock({data: `block ${i}`});

    // Set the next block in the chain
    nextBlock = blockchain.chain[blockchain.chain.length - 1];

    // Set the next timestamp
    nextTimestamp = nextBlock.timestamp;

    // Calc the time difference
    timeDiff = nextTimestamp - prevTimestamp;

    // Add the timeDiff the the overall array
    times.push(timeDiff);

    // Calc the average time
    average = times.reduce((total, num) => (total + num)) / times.length;

    console.log(`Block no. ${i}`);
    console.log(`Time taken to mine the Block: ${timeDiff}ms. Difficulty: ${nextBlock.difficulty}. Average time: ${average}ms.`);
}