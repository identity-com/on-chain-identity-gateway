import {
    Keypair, PublicKey,
} from '@solana/web3.js';
import {NetworkService} from "../../src/NetworkService";

export const loadPrivateKey = (publicKeyBs58: string) => {
    const data = require(`../fixtures/keypairs/${publicKeyBs58}.json`);

    return Keypair.fromSecretKey(new Uint8Array(data));
}

export const setGatekeeperFlags = async (service: NetworkService, flags: number) => {
    const gatekeeper = await service.getGatekeeperAccount();

    await service
        .updateGatekeeper({
            authThreshold: 1,
            gatekeeperNetwork: gatekeeper?.gatekeeperNetwork,
            tokenFees: { remove: [] as any, add: [] as any },
            stakingAccount: null,
            authKeys: {
                add: [
                    {
                        key: service.getWallet().publicKey,
                        flags: flags,
                    },
                ],
                remove: [],
            },
        })
        .rpc();
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));