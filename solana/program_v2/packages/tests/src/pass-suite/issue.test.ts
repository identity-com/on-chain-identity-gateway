import {
  GatekeeperService,
  PassAccount,
  PassState,
  onGatewayPass,
  findGatewayPass,
  airdrop,
} from '@identity.com/gateway-solana-client';
import {
  TEST_GATEKEEPER,
  TEST_GATEKEEPER_AUTHORITY,
  TEST_MINT,
  TEST_NETWORK,
} from '../util/constants';
import chai from 'chai';
import { Keypair, PublicKey, Signer } from '@solana/web3.js';
import { createGatekeeperService } from './util';
import {
  AccountLayout,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { Account } from '@solana/spl-token/src/state/account';

const expect = chai.expect;

describe.only('Issue pass', () => {
  let service: GatekeeperService;
  let account: PublicKey;
  let network: Account;
  let gatekeeper: Account;
  let funder: Account;

  const subject = Keypair.generate().publicKey;
  const signer: Signer = Keypair.generate();

  beforeEach(async () => {
    service = await createGatekeeperService();
    account = await GatekeeperService.createPassAddress(subject, TEST_NETWORK);
    await airdrop(service.getConnection(), signer.publicKey);

    network = await getOrCreateAssociatedTokenAccount(
      service.getConnection(),
      signer,
      TEST_MINT,
      TEST_NETWORK,
      true
    );
    gatekeeper = await getOrCreateAssociatedTokenAccount(
      service.getConnection(),
      signer,
      TEST_MINT,
      TEST_GATEKEEPER,
      true
    );
    funder = await getOrCreateAssociatedTokenAccount(
      service.getConnection(),
      signer,
      TEST_MINT,
      TEST_GATEKEEPER_AUTHORITY,
      true
    );

    // TODO(julian): Load from file instead, TEST_MINT_AUTH, and create constant
    const key = Keypair.fromSecretKey(
      new Uint8Array([
        78, 42, 249, 225, 72, 184, 149, 57, 44, 150, 231, 167, 78, 240, 192,
        131, 12, 54, 141, 146, 157, 115, 170, 30, 84, 139, 47, 103, 109, 248,
        155, 12, 125, 118, 182, 55, 27, 167, 226, 69, 222, 147, 190, 3, 135, 96,
        212, 50, 226, 83, 86, 202, 26, 182, 253, 60, 165, 248, 130, 60, 223,
        235, 110, 142,
      ])
    );
    await mintTo(
      service.getConnection(),
      key,
      TEST_MINT,
      funder.address,
      new PublicKey('9SkxBuj9kuaJQ3yAXEuRESjYt14BcPUTac25Mbi1n8ny'),
      100
    );
  });

  it.only('Issues a pass', async () => {
    // Act
    await service
      .issue(
        account,
        subject,
        TOKEN_PROGRAM_ID,
        TEST_MINT,
        gatekeeper.address,
        network.address,
        funder.address
      )
      .rpc();
    const pass = await service.getPassAccount(subject);

    const tokenNetworkAccountInfo = await service
      .getConnection()
      .getAccountInfo(funder.address);

    const funderAccount = AccountLayout.decode(tokenNetworkAccountInfo!.data);

    // Assert
    expect(pass).to.deep.include({
      version: 0,
      subject,
      network: TEST_NETWORK,
      gatekeeper: TEST_GATEKEEPER,
      state: PassState.Active,
    });

    // CHECK: that the issueTime is recent (is this best?)
    expect(pass?.issueTime).to.be.greaterThan(new Date().getTime() - 5000);
    expect(pass?.issueTime).to.be.lessThan(new Date().getTime() + 5000);

    // Check if fee was taken
    expect(funderAccount.amount).to.equal(90);
  });

  it('listens for a gateway pass to be created', async () => {
    // The promise will resolve when the token is created
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    let heardCreationCallback: (pass: PassAccount) => void = () => {};

    const heardCreation = new Promise((resolve) => {
      heardCreationCallback = resolve;
    });

    const subscriptionId = await onGatewayPass(
      service.getConnection(),
      TEST_NETWORK,
      subject,
      0,
      heardCreationCallback
    );

    const account = await GatekeeperService.createPassAddress(
      subject,
      TEST_NETWORK
    );

    service
      .issue(
        account,
        subject,
        TEST_MINT,
        TEST_MINT,
        gatekeeper.address,
        network.address,
        funder.address
      )
      .rpc();

    await heardCreation;

    await service.getConnection().removeAccountChangeListener(subscriptionId);
  });

  it('Finds a gateway token after issue', async () => {
    // Assemble
    await service
      .issue(
        account,
        subject,
        TEST_MINT,
        TEST_MINT,
        gatekeeper.address,
        network.address,
        funder.address
      )
      .rpc();

    // Act
    const pass = await findGatewayPass(
      service.getConnection(),
      TEST_NETWORK,
      subject
    );

    // Assert
    expect(pass).to.deep.include({
      version: 0,
      subject,
      network: TEST_NETWORK,
      gatekeeper: TEST_GATEKEEPER,
      state: PassState.Active,
    });

    // CHECK: that the issueTime is recent (is this best?)
    expect(pass?.issueTime).to.be.greaterThan(new Date().getTime() - 5000);
    expect(pass?.issueTime).to.be.lessThan(new Date().getTime() + 5000);
  });
});
