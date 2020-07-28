// Refer to the crypto module
const crypto = require('crypto');

// Creating the crypto-hash function
// The ...inputs: means that it will gather all the argumets and
// put it into an array, ie. if there is 1 argument, the array will
// have size 1, 2 arguments => size of 2, etc.
const cryptoHash = (...inputs) => {
    const hash = crypto.createHash('sha256');

    hash.update(inputs.map((input) => JSON.stringify(input)).sort().join(' '));
    return hash.digest('hex');
};

module.exports = cryptoHash;