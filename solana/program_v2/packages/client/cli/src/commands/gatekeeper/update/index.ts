import { Command, Flags } from '@oclif/core';
import { parseGatekeeperUpdateData } from '../../../util/util';
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import {
  airdrop,
  UpdateGatekeeperData,
  NetworkService,
} from '@identity.com/gateway-solana-client';
import { Wallet } from '@project-serum/anchor';
import fsPromises from 'node:fs/promises';
import { ExtendedCluster } from '@identity.com/gateway-solana-client/dist/lib/connection';

export default class Update extends Command {
  static description = 'Updates a gatekeeper on an existing network';

  static examples = [
    `$ gateway gatekeeper update --network [address] --funder [path_to_funder_key]
`,
  ];

  static flags = {
    help: Flags.help({ char: 'h' }),
    gatekeeper: Flags.string({
      char: 'g',
      description: "String representing the gatekeeper's address",
      required: true,
    }),
    data: Flags.string({
      char: 'd',
      description:
        'Path to a JSON data file representing the new state of the network',
      required: true,
    }),
    network: Flags.string({
      char: 'n',
      description: "String representing the network's address",
      required: true,
    }),
    funder: Flags.string({
      char: 'f',
      description: 'Path to a solana keypair',
      required: false,
    }),
  };

  static args = [];

  async run(): Promise<void> {
    const { flags } = await this.parse(Update);

    const gatekeeper = new PublicKey(flags.gatekeeper);
    const data = await fsPromises.readFile(`${__dirname}/${flags.data}`);
    const updateData = JSON.parse(data.toString()) as UpdateGatekeeperData;
    const stakingAccount = Keypair.generate().publicKey;

    const localSecretKey = flags.funder
      ? await fsPromises.readFile(`${__dirname}/${flags.funder}`)
      : await fsPromises.readFile(
          `${__dirname}/../../../keypairs/network-authority.json`
        );

    const authKey = await fsPromises.readFile(
      `${__dirname}/../../../keypairs/gatekeeper-authority.json`
    );

    const authKeyArr = Uint8Array.from(JSON.parse(authKey.toString()));
    const authPair = Keypair.fromSecretKey(authKeyArr);

    const privateKey = Uint8Array.from(JSON.parse(localSecretKey.toString()));
    const authorityKeypair = Keypair.fromSecretKey(privateKey);
    const authorityWallet = new Wallet(authorityKeypair);

    const networkService = await NetworkService.build(
      authPair.publicKey,
      gatekeeper,
      {
        wallet: authorityWallet,
        clusterType: 'localnet' as ExtendedCluster,
      }
    );

    await airdrop(
      networkService.getConnection(),
      authorityWallet.publicKey,
      LAMPORTS_PER_SOL * 2
    );

    const parsedData = parseGatekeeperUpdateData(updateData);

    const updateGatekeeperSignature = await networkService
      .updateGatekeeper(parsedData, stakingAccount) // data.json, stakingAccount and autority key?
      .rpc();

    this.log(updateGatekeeperSignature);

    const UpdatedGatekeeper = await networkService.getGatekeeperAccount(
      gatekeeper
    );

    this.log(UpdatedGatekeeper?.tokenFees[0].token.toBase58());
  }
}
