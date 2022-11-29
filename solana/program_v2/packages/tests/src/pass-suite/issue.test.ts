import {
  GatekeeperService,
  airdrop,
  NetworkService,
  AdminService,
  PassState,
} from '@identity.com/gateway-solana-client';
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import * as anchor from '@project-serum/anchor';
import { SolanaAnchorGateway } from '@identity.com/gateway-solana-idl';
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { setGatekeeperFlagsAndFees } from '../util/lib';
import { expect } from 'chai';

describe.only('issue', () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace
    .SolanaAnchorGateway as anchor.Program<SolanaAnchorGateway>;
  const programProvider = program.provider as anchor.AnchorProvider;

  let adminService: AdminService;
  let networkService: NetworkService;
  let gatekeeperService: GatekeeperService;

  let gatekeeperPDA: PublicKey;
  let stakingPDA: PublicKey;
  let passAccount: PublicKey;
  let mint: PublicKey;

  let adminAuthority: Keypair;
  let networkAuthority: Keypair;
  let gatekeeperAuthority: Keypair;
  let mintAuthority: Keypair;
  let subject: Keypair;
  let mintAccount: Keypair;

  before(async () => {
    adminAuthority = Keypair.generate();
    networkAuthority = Keypair.generate();
    gatekeeperAuthority = Keypair.generate();
    mintAuthority = Keypair.generate();
    subject = Keypair.generate();
    mintAccount = Keypair.generate();

    // Airdrops
    await airdrop(
      programProvider.connection,
      adminAuthority.publicKey,
      LAMPORTS_PER_SOL * 2
    );
    await airdrop(
      programProvider.connection,
      networkAuthority.publicKey,
      LAMPORTS_PER_SOL * 2
    );
    await airdrop(
      programProvider.connection,
      gatekeeperAuthority.publicKey,
      LAMPORTS_PER_SOL * 2
    );
    await airdrop(
      programProvider.connection,
      mintAuthority.publicKey,
      LAMPORTS_PER_SOL * 2
    );

    mint = await createMint(
      programProvider.connection,
      mintAuthority,
      mintAuthority.publicKey,
      null,
      0,
      mintAccount
    );

    [gatekeeperPDA] = await NetworkService.createGatekeeperAddress(
      gatekeeperAuthority.publicKey,
      networkAuthority.publicKey
    );

    [stakingPDA] = await NetworkService.createStakingAddress(
      gatekeeperAuthority.publicKey
    );

    adminService = await AdminService.buildFromAnchor(
      program,
      networkAuthority.publicKey,
      {
        clusterType: 'localnet',
        wallet: new anchor.Wallet(adminAuthority),
      },
      programProvider
    );

    networkService = await NetworkService.buildFromAnchor(
      program,
      gatekeeperAuthority.publicKey,
      gatekeeperPDA,
      {
        clusterType: 'localnet',
        wallet: new anchor.Wallet(gatekeeperAuthority),
      },
      programProvider
    );

    await adminService
      .createNetwork({
        authThreshold: 1,
        passExpireTime: 10000,
        fees: [
          {
            token: mint,
            issue: new anchor.BN(1),
            refresh: new anchor.BN(1),
            expire: new anchor.BN(1),
            verify: new anchor.BN(1),
          },
        ],
        authKeys: [{ flags: 4097, key: networkAuthority.publicKey }],
        supportedTokens: [],
      })
      .withPartialSigners(networkAuthority)
      .rpc();

    await networkService
      .createGatekeeper(
        networkAuthority.publicKey,
        stakingPDA,
        adminAuthority.publicKey
      )
      .withPartialSigners(adminAuthority)
      .rpc();

    await setGatekeeperFlagsAndFees(stakingPDA, networkService, 65535, [
      {
        token: mint,
        issue: new anchor.BN(1),
        refresh: new anchor.BN(1),
        expire: new anchor.BN(1),
        verify: new anchor.BN(1),
      },
    ]);

    passAccount = await GatekeeperService.createPassAddress(
      subject.publicKey,
      networkAuthority.publicKey
    );

    // Airdrop to passAccount
    await airdrop(
      programProvider.connection,
      passAccount,
      LAMPORTS_PER_SOL * 2
    );

    gatekeeperService = await GatekeeperService.buildFromAnchor(
      program,
      networkAuthority.publicKey,
      gatekeeperPDA,
      {
        clusterType: 'localnet',
        wallet: new anchor.Wallet(gatekeeperAuthority),
      }
    );
  });

  it.only('should issue pass', async () => {
    // Assemble
    const signer = Keypair.generate();
    const funderKeypair = Keypair.generate();

    await airdrop(programProvider.connection, signer.publicKey);
    await airdrop(programProvider.connection, funderKeypair.publicKey);

    const gatekeeperAta = await getOrCreateAssociatedTokenAccount(
      programProvider.connection,
      adminAuthority,
      mint,
      gatekeeperPDA,
      true
    );

    const networkAta = await getOrCreateAssociatedTokenAccount(
      programProvider.connection,
      adminAuthority,
      mint,
      networkAuthority.publicKey,
      true
    );

    const funderAta = await getOrCreateAssociatedTokenAccount(
      programProvider.connection,
      adminAuthority,
      mint,
      gatekeeperAuthority.publicKey,
      true
    );

    await mintTo(
      gatekeeperService.getConnection(),
      mintAuthority,
      mint,
      funderAta.address,
      mintAuthority,
      2000
    );

    // Act
    await gatekeeperService
      .issue(
        passAccount,
        subject.publicKey,
        TOKEN_PROGRAM_ID,
        mint,
        gatekeeperAta.address,
        networkAta.address,
        funderAta.address
      )
      .rpc();
    const pass = await gatekeeperService.getPassAccount(subject.publicKey);

    // Assert
    expect(pass).to.deep.include({
      version: 0,
      subject: subject.publicKey,
      network: networkAuthority.publicKey,
      gatekeeper: gatekeeperPDA,
      state: PassState.Active,
    });

    // CHECK: that the issueTime is recent (is this best?)
    expect(pass?.issueTime).to.be.greaterThan(new Date().getTime() - 5000);
    expect(pass?.issueTime).to.be.lessThan(new Date().getTime() + 5000);
  });

  it('');

  // it('should issue a pass', async () => {
  //   const [gatekeeperPDA] =
  //     await NetworkService.createGatekeeperAddress(
  //       gatekeeperKeypair.publicKey,
  //       networkKeypair.publicKey
  //     );
  //
  //   const [stakingPDA] = await NetworkService.createStakingAddress(
  //     networkKeypair.publicKey
  //   );
  //
  //   // Airdrop to funderKeypair
  //   await airdrop(
  //     programProvider.connection,
  //     funderKeypair.publicKey,
  //     LAMPORTS_PER_SOL * 2
  //   );
  //
  //   // Airdrop to network
  //   await airdrop(
  //     programProvider.connection,
  //     networkKeypair.publicKey,
  //     LAMPORTS_PER_SOL * 2
  //   );
  //
  //   // Airdrop to mint
  //   await airdrop(
  //     programProvider.connection,
  //     mintKeypair.publicKey,
  //     LAMPORTS_PER_SOL * 2
  //   );
  //
  //   const adminService = await AdminService.buildFromAnchor(
  //     program,
  //     adminKeypair.publicKey,
  //     {
  //       clusterType: 'localnet',
  //       wallet: adminWallet,
  //     }
  //   );
  //
  //   const networkService = await NetworkService.buildFromAnchor(
  //     program,
  //     gatekeeperKeypair.publicKey,
  //     gatekeeperPDA,
  //     {
  //       clusterType: 'localnet',
  //       wallet: new anchor.Wallet(gatekeeperKeypair),
  //     },
  //     programProvider
  //   );
  //
  //   await adminService.createNetwork().withPartialSigners(networkKeypair).rpc();
  //
  //   await networkService
  //     .createGatekeeper(
  //       networkKeypair.publicKey,
  //       stakingPDA,
  //       adminKeypair.publicKey
  //     )
  //     .withPartialSigners(adminKeypair)
  //     .rpc();
  //
  //   const passAccount = await GatekeeperService.createPassAddress(
  //     subject.publicKey,
  //     networkKeypair.publicKey
  //   );
  //
  //   // Airdrop to passAccount
  //   await airdrop(
  //     programProvider.connection,
  //     passAccount,
  //     LAMPORTS_PER_SOL * 2
  //   );
  //
  //   const gatekeeperService = await GatekeeperService.buildFromAnchor(
  //     program,
  //     networkKeypair.publicKey,
  //     gatekeeperKeypair.publicKey
  //   );
  //
  //   const passAddress = await GatekeeperService.createPassAddress(
  //     subjectKeypair.publicKey,
  //     networkKeypair.publicKey
  //   );
  //
  //   await airdrop(gatekeeperService.getConnection(), signerKeypair.publicKey);
  //
  //   const mint = await createMint(
  //     programProvider.connection,
  //     mintKeypair,
  //     mintKeypair.publicKey,
  //     null,
  //     0,
  //     mintAccount
  //   );
  //
  //   const gatekeeperAta = await getOrCreateAssociatedTokenAccount(
  //     gatekeeperService.getConnection(),
  //     signerKeypair,
  //     mint,
  //     gatekeeperKeypair.publicKey,
  //     true
  //   );
  //
  //   const networkAta = await getOrCreateAssociatedTokenAccount(
  //     gatekeeperService.getConnection(),
  //     signerKeypair,
  //     mint,
  //     networkKeypair.publicKey,
  //     true
  //   );
  //
  //   const funderAta = await getOrCreateAssociatedTokenAccount(
  //     gatekeeperService.getConnection(),
  //     signerKeypair,
  //     mint,
  //     funderKeypair.publicKey,
  //     true
  //   );
  //
  //   await mintTo(
  //     gatekeeperService.getConnection(),
  //     mintKeypair,
  //     mint,
  //     funderAta.address,
  //     mintKeypair,
  //     2000
  //   );
  //
  //   try {
  //     console.log('issuing pass', passAccount);
  //     await gatekeeperService
  //       .issue(
  //         passAddress,
  //         subject.publicKey,
  //         TOKEN_PROGRAM_ID,
  //         mint,
  //         gatekeeperAta.address,
  //         networkAta.address,
  //         funderAta.address
  //       )
  //       .rpc();
  //   } catch (e) {
  //     console.log(e);
  //   }
  // });

  // it('Issues a pass', async () => {
  // try {
  //   // Act
  //   console.log('cccccccc');
  //
  //   console.log('dddddddd');
  //   const [stakingAccount] = await NetworkService.createStakingAddress(
  //     TEST_NETWORK
  //   );
  //   await networkService.createGatekeeper(TEST_NETWORK, stakingAccount).rpc();
  //
  //   await setGatekeeperFlagsAndFees(stakingAccount, networkService, 65535, [
  //     {
  //       token: TEST_MINT,
  //       issue: new anchor.BN(8989),
  //       refresh: new anchor.BN(2031),
  //       expire: new anchor.BN(1231),
  //       verify: new anchor.BN(1023),
  //     },
  //   ]);
  //   console.log('eeeeeeee');
  //
  //   await gatekeeperService
  //     .issue(
  //       account,
  //       subject,
  //       TOKEN_PROGRAM_ID,
  //       TEST_MINT,
  //       gatekeeperAta.address,
  //       networkAta.address,
  //       funderAta.address
  //     )
  //     .rpc();
  // } catch (e) {
  //   console.log(e);
  // }
  // const pass = await gatekeeperService.getPassAccount(subject);
  //
  // const funderAtaAccountInfo = await gatekeeperService
  //   .getConnection()
  //   .getAccountInfo(funderAta.address);
  //
  // const networkAtaAccountInfo = await gatekeeperService
  //   .getConnection()
  //   .getAccountInfo(networkAta.address);
  //
  // const gatekeeperAtaAccountInfo = await gatekeeperService
  //   .getConnection()
  //   .getAccountInfo(gatekeeperAta.address);
  //
  // const funderAccount = AccountLayout.decode(funderAtaAccountInfo!.data);
  // const networkAccount = AccountLayout.decode(networkAtaAccountInfo!.data);
  // const gatekeeperAccount = AccountLayout.decode(
  //   gatekeeperAtaAccountInfo!.data
  // );
  //
  // // Assert
  // expect(pass).to.deep.include({
  //   version: 0,
  //   subject,
  //   network: TEST_NETWORK,
  //   gatekeeper: TEST_GATEKEEPER,
  //   state: PassState.Active,
  // });
  //
  // // CHECK: that the issueTime is recent (is this best?)
  // expect(pass?.issueTime).to.be.greaterThan(new Date().getTime() - 5000);
  // expect(pass?.issueTime).to.be.lessThan(new Date().getTime() + 5000);
  //
  // // Check if fee was taken
  // expect(funderAccount.amount).to.equal(1000n);
  // expect(networkAccount.amount).to.equal(50n);
  // expect(gatekeeperAccount.amount).to.equal(950n);
  // });
  //
  // it('listens for a gateway pass to be created', async () => {
  //   // The promise will resolve when the token is created
  //   // eslint-disable-next-line @typescript-eslint/no-empty-function
  //   let heardCreationCallback: (pass: PassAccount) => void = () => {};
  //
  //   const heardCreation = new Promise((resolve) => {
  //     heardCreationCallback = resolve;
  //   });
  //
  //   const subscriptionId = await onGatewayToken(
  //     gatekeeperService.getConnection(),
  //     TEST_NETWORK,
  //     subject,
  //     0,
  //     heardCreationCallback
  //   );
  //
  //   const account = await GatekeeperService.createPassAddress(
  //     subject,
  //     TEST_NETWORK
  //   );
  //
  //   gatekeeperService
  //     .issue(
  //       account,
  //       subject,
  //       TOKEN_PROGRAM_ID,
  //       TEST_MINT,
  //       gatekeeperAta.address,
  //       networkAta.address,
  //       funderAta.address
  //     )
  //     .rpc();
  //
  //   await heardCreation;
  //
  //   await gatekeeperService
  //     .getConnection()
  //     .removeAccountChangeListener(subscriptionId);
  // });
  //
  // it('Finds a gateway token after issue', async () => {
  //   // Assemble
  //   await gatekeeperService
  //     .issue(
  //       account,
  //       subject,
  //       TOKEN_PROGRAM_ID,
  //       TEST_MINT,
  //       gatekeeperAta.address,
  //       networkAta.address,
  //       funderAta.address
  //     )
  //     .rpc();
  //
  //   // Act
  //   const pass = await findGatewayPass(
  //     gatekeeperService.getConnection(),
  //     TEST_NETWORK,
  //     subject
  //   );
  //
  //   // Assert
  //   expect(pass).to.deep.include({
  //     version: 0,
  //     subject,
  //     network: TEST_NETWORK,
  //     gatekeeper: TEST_GATEKEEPER,
  //     state: PassState.Active,
  //   });
  //
  //   // CHECK: that the issueTime is recent (is this best?)
  //   expect(pass?.issueTime).to.be.greaterThan(new Date().getTime() - 5000);
  //   expect(pass?.issueTime).to.be.lessThan(new Date().getTime() + 5000);
  // });
});
