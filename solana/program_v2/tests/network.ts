// describe("network operations", () => {
//   const provider = anchor.AnchorProvider.env();
//   anchor.setProvider(provider);

//   it("cannot update to remove auth flag from account", async () => {
//     const { address } = await createAccount();

//     return expect(
//       program.methods
//         .updateNetwork({
//           authKeys: {
//             add: [
//               {
//                 flags: new anchor.BN(2),
//                 key: provider.wallet.publicKey,
//               },
//             ],
//             remove: [],
//           },
//           fees: { add: [], remove: [] },
//         })
//         .accounts({
//           network: address,
//         })
//         .signers([])
//         .rpc()
//     ).to.eventually.be.rejected;
//   });
// });
