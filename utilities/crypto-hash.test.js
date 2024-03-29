const cryptoHash = require('./crypto-hash');

describe('cryptoHash()', () => {
    it('generetes a SHA-256 hased output',() => {
        expect(cryptoHash('foo'))
            .toEqual("b2213295d564916f89a6a42455567c87c3f480fcd7a1c15e220f17d7169a790b");
    });

    it('produces the same hash with the same arguments in any order',() => {
        expect(cryptoHash('one', 'two','three'))
            .toEqual(cryptoHash('three', 'one', 'two'));
    });

    it('produces a unique hash when the properties have changed on an input', () => {
        const testObject = {};
        const originalHash =  cryptoHash(testObject);

        testObject['1'] = 'a';

        expect(cryptoHash(testObject)).not.toEqual(originalHash);
    });
});