import {
    Keypair,
} from '@solana/web3.js';

export const loadPrivateKey = (publicKeyBs58: string) => {
    const data = require(`../fixtures/keypairs/${publicKeyBs58}.json`);

    return Keypair.fromSecretKey(new Uint8Array(data));
}