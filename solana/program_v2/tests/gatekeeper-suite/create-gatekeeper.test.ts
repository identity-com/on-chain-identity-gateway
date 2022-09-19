// import { GatewayService } from '../../src/GatewayService';
// import { GatewayV2 } from '../../target/types/gateway_v2';
// import * as anchor from '@project-serum/anchor';
// import { Keypair, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
// import { airdrop } from '../../src/lib/utils';
// import { expect } from 'chai';
// import { describe } from 'mocha';

// describe('Gateway v2 Client', () => {
//   anchor.setProvider(anchor.AnchorProvider.env());
//   const program = anchor.workspace.GatewayV2 as anchor.Program<GatewayV2>;
//   const programProvider = program.provider as anchor.AnchorProvider;

//   let service: GatewayService;
//   let dataAccount: PublicKey;

//   let authority: anchor.Wallet;
//   let createdNetwork;

//   before(async () => {
//     authority = new anchor.Wallet(Keypair.generate());
//     await airdrop(
//       programProvider.connection,
//       authority.publicKey,
//       LAMPORTS_PER_SOL * 2
//     );
//     [dataAccount] = await GatewayService.createNetworkAddress(
//       authority.publicKey
//     );

//     service = await GatewayService.buildFromAnchor(
//       program,
//       dataAccount,
//       'localnet',
//       programProvider,
//       authority
//     );

//     await service.createNetwork().rpc();

//     createdNetwork = await service.getNetworkAccount();
//     console.log(createdNetwork);
//   });
//   describe('Create Gatekeeper', () => {
//     it.only(
//       'Creates a gatekeeper on an established network',
//       async function () {
//         // let gatekeeper = service
//         //   .createGatekeeper(
//         //     {
//         //       authThreshold: 1,
//         //       signerBump: 0,
//         //       authKeys: [],
//         //       gatekeeperNetwork: createdNetwork,
//         //       addresses: Keypair.generate().publicKey,
//         //       stakingAccount: Keypair.generate().publicKey,
//         //       fees: [],
//         //     },
//         //     authority.publicKey
//         //   )
//         //   .rpc();
//         console.log('testing?');
//       }
//     ).timeout(10000);
//   });
// });
