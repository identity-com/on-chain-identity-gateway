import * as anchor from "@project-serum/anchor";
import {Program} from "@project-serum/anchor";
import {GatewayV2} from "../target/types/gateway_v2";

describe("gateway_v2", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.GatewayV2 as Program<GatewayV2>;

  it("Is initialized!", async () => {
    try {
      const baseAccount = anchor.web3.Keypair.generate();
      const tx = await program.rpc.createNetwork(
        {
          authThreshold: new anchor.BN(1),
          passExpireTime: new anchor.BN(60 * 61),
          networkDataLen: new anchor.BN(16),
          signerBump: new anchor.BN(3),
          fees: [{
            token: baseAccount.publicKey,
            issue: new anchor.BN(100),
            refresh: new anchor.BN(100),
            expire: new anchor.BN(100),
            verify: new anchor.BN(100)
          }],
          authKeys: [
            {
              flags: new anchor.BN(1),
              key: baseAccount.publicKey
            }
          ],
        },
        {
          accounts: {
            network: baseAccount.publicKey,
            payer: provider.wallet.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          },
          signers: [baseAccount],
        }
      );

      console.log("Your transaction signature", tx);

      const account = await program.account.gatekeeperNetwork.fetch(baseAccount.publicKey);
      console.log(JSON.stringify(account, null, 2));
    } catch (e) {
      console.log(e);
    }
  });
});
