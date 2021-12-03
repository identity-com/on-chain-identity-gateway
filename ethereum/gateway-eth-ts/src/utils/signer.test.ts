import { Wallet } from 'ethers';
import { privateKeySigner, mnemonicSigner } from './signer';
import assert = require('assert');

describe('Check ethers signers', function() {
    let wallet: Wallet;

    const samplePrivateKey = "16cf319b463e6e8db6fc525ad2cb300963a0f0661dbb94b5209073e29b43abfe";
    const privateKeyAddr = "0x2de1EFea6044b44432aedBC9f29861296695AF0C";
    const invalidPrivateKey = "16cf319b463e6e8db6fc525ad2cb300963a0f0661dbb94b5209073e29b3asad12";

    const sampleMnemonic = "test test test test test test test test test test test junk";
    const mnemonicAddr = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
    const invalidMnemonic = 'test test test test test test test test test invalid mnemonic phrase';
    
    it('Try to generate wallet from private key, should throw an error on invalid private key or mnemonic', async () => {
        wallet = privateKeySigner(samplePrivateKey);
        assert.equal(wallet.address, privateKeyAddr);

        assert.throws(() => { privateKeySigner(invalidPrivateKey) }, Error);
        assert.throws(() => { privateKeySigner(sampleMnemonic) }, Error);
        assert.throws(() => { privateKeySigner(invalidMnemonic) }, Error);
    });

    it('Try to generate wallet from mnemonic phrase, should throw an error on invalid mnemonic or private key', async () => {
        wallet = mnemonicSigner(sampleMnemonic);
        assert.equal(wallet.address, mnemonicAddr);

        assert.throws(() => { mnemonicSigner(invalidMnemonic) }, new Error("invalid mnemonic"));
        assert.throws(() => { mnemonicSigner(samplePrivateKey) }, new Error("invalid mnemonic"));
    });

});