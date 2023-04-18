import { ethers, upgrades } from 'hardhat';
import { BigNumber, Contract, PopulatedTransaction, Wallet } from 'ethers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

import { toBytes32 } from './utils';

import { expect } from 'chai';
import { NULL_CHARGE, randomAddress } from './utils/eth';
import { signMetaTxRequest } from '../../gateway-eth-ts/src/utils/metatx';
import { IForwarder } from '../typechain-types';

const NULL_ADDRESS = '0x0000000000000000000000000000000000000000';

describe('GatewayToken', async () => {
  let signers: SignerWithAddress[];
  let identityCom: SignerWithAddress;
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;
  let carol: SignerWithAddress;
  let gatekeeper: SignerWithAddress;
  let gatekeeper2: SignerWithAddress;
  let networkAuthority2: SignerWithAddress;

  let forwarder: Contract;
  let flagsStorage: Contract;
  let gatewayToken: Contract;

  let hexRetailFlag = toBytes32('Retail');
  let hexInstitutionFlag = toBytes32('Institution');
  let hexAccreditedInvestorFlag = toBytes32('AccreditedInvestor');

  let gkn1 = 10;
  let gkn2 = 20;

  const expectVerified = (address: string, gkn: number): Chai.PromisedAssertion => {
    const verified = gatewayToken['verifyToken(address,uint256)'](address, gkn);
    return expect(verified).eventually;
  };

  const makeMetaTx = (tx: PopulatedTransaction) =>
    signMetaTxRequest(gatekeeper, forwarder as IForwarder, {
      from: gatekeeper.address,
      to: gatewayToken.address,
      data: tx.data as string,
    });

  before('deploy contracts', async () => {
    [identityCom, alice, bob, carol, gatekeeper, gatekeeper2, networkAuthority2] = await ethers.getSigners();

    const forwarderFactory = await ethers.getContractFactory('FlexibleNonceForwarder');
    const flagsStorageFactory = await ethers.getContractFactory('FlagsStorage');
    const gatewayTokenFactory = await ethers.getContractFactory('GatewayToken');

    forwarder = await forwarderFactory.deploy(100);
    await forwarder.deployed();

    // flagsStorage = await flagsStorageFactory.deploy(identityCom.address);
    flagsStorage = await upgrades.deployProxy(flagsStorageFactory, [identityCom.address], { kind: 'uups' });
    await flagsStorage.deployed();

    const args = ['Gateway Protocol', 'GWY', identityCom.address, flagsStorage.address, [forwarder.address]];
    gatewayToken = await upgrades.deployProxy(gatewayTokenFactory, args, { kind: 'uups' });
    await gatewayToken.deployed();

    // create gatekeeper networks
    await gatewayToken.connect(identityCom).createNetwork(gkn1, 'Test GKN 1', false, NULL_ADDRESS);
    await gatewayToken.connect(identityCom).createNetwork(gkn2, 'Test GKN 2', false, NULL_ADDRESS);
  });

  describe('Deployment Tests', async () => {
    it('fails deployment with a NULL ADDRESS for the superAdmin', async () => {
      const gatewayTokenFactory = await ethers.getContractFactory('GatewayToken');

      const args = ['Gateway Protocol', 'GWY', NULL_ADDRESS, flagsStorage.address, [forwarder.address]];
      await expect(upgrades.deployProxy(gatewayTokenFactory, args, { kind: 'uups' })).to.be.revertedWithCustomError(
        gatewayToken,
        'Common__MissingAccount',
      );
    });

    it('fails deployment with a NULL ADDRESS for the flagsStorage', async () => {
      const gatewayTokenFactory = await ethers.getContractFactory('GatewayToken');

      const args = ['Gateway Protocol', 'GWY', identityCom.address, NULL_ADDRESS, [forwarder.address]];
      await expect(upgrades.deployProxy(gatewayTokenFactory, args, { kind: 'uups' })).to.be.revertedWithCustomError(
        gatewayToken,
        'Common__MissingAccount',
      );
    });

    it('fails deployment with a NULL ADDRESS for the trusted forwarder array', async () => {
      const gatewayTokenFactory = await ethers.getContractFactory('GatewayToken');

      const args = [
        'Gateway Protocol',
        'GWY',
        identityCom.address,
        flagsStorage.address,
        [forwarder.address, NULL_ADDRESS],
      ];
      await expect(upgrades.deployProxy(gatewayTokenFactory, args, { kind: 'uups' })).to.be.revertedWithCustomError(
        gatewayToken,
        'Common__MissingAccount',
      );
    });
  });

  describe('Test get gatekeeper network', async () => {
    it('Get gatekeeper network by id', async () => {
      let network = await gatewayToken.getNetwork(gkn1);
      expect(network).to.equal('Test GKN 1');
    });
  });

  describe('Test executing functions only for Identity.com admin by third-party address', async () => {
    it('Try to change admin by Bob, expect revert due to invalid access', async () => {
      await expect(gatewayToken.connect(bob).setSuperAdmin(bob.address)).to.be.revertedWithCustomError(
        gatewayToken,
        'Common__NotSuperAdmin',
      );
    });
  });

  describe('Test FlagsStorage smart contract', async () => {
    it('Try to add new flag by Bob, expect revert due to invalid access', async () => {
      await expect(flagsStorage.connect(bob).addFlag(hexRetailFlag, 0)).to.be.revertedWithCustomError(
        gatewayToken,
        'Common__NotSuperAdmin',
      );
    });

    it('Successfully add flag by superadmin, expect success', async () => {
      await flagsStorage.connect(identityCom).addFlag(hexRetailFlag, 0);
    });

    it('Successfully add several flags by daoController, expect success', async () => {
      let flagCodes = [hexInstitutionFlag, hexAccreditedInvestorFlag];
      let indexArray = [1, 2];

      await flagsStorage.addFlags(flagCodes, indexArray);
    });

    it('Try to add new flag at already used index, expect revert', async () => {
      await expect(flagsStorage.addFlag(hexRetailFlag, 0)).to.be.revertedWithCustomError(
        flagsStorage,
        'FlagsStorage__IndexAlreadyUsed',
      );
    });
  });

  describe('Test adding network authorities', async () => {
    it('Successfully add 1 new network authority to gatekeeper network', async () => {
      await gatewayToken.connect(identityCom).addNetworkAuthority(networkAuthority2.address, gkn1);
      expect(await gatewayToken.connect(identityCom).isNetworkAuthority(networkAuthority2.address, gkn1)).to.be.true;
    });

    it('Successfully add a gatekeeper after becoming network authority', async () => {
      await gatewayToken.connect(networkAuthority2).addGatekeeper(gatekeeper.address, gkn1);
    });

    it('Expect revert when attempting to issue as a non-gatekeeper network authority', async () => {
      await expect(
        gatewayToken.connect(networkAuthority2).mint(alice.address, gkn1, 0, 0, NULL_CHARGE),
      ).to.be.revertedWithCustomError(gatewayToken, 'Common__Unauthorized');
    });

    it("Try to remove non-existing network authorities, don't expect revert", async () => {
      await gatewayToken
        .connect(identityCom)
        .removeNetworkAuthority('0x2F60d06Fa6795365B7b42B27Fa23e3e8c8b82f66', gkn1);
    });

    it('Remove a network authority', async () => {
      await gatewayToken.connect(identityCom).removeNetworkAuthority(networkAuthority2.address, gkn1);
    });

    it('Expect revert on adding new network authority by Alice', async () => {
      await expect(gatewayToken.connect(alice).addNetworkAuthority(bob.address, gkn1)).to.be.revertedWithCustomError(
        gatewayToken,
        'Common__Unauthorized',
      );
    });

    it('Expect revert on removing existing network authority by Alice', async () => {
      await expect(
        gatewayToken.connect(alice).removeNetworkAuthority(identityCom.address, gkn1),
      ).to.be.revertedWithCustomError(gatewayToken, 'Common__Unauthorized');
    });
  });

  describe('Add Gatekeeper', () => {
    it('can add a gatekeeper', async () => {
      await gatewayToken.connect(identityCom).addGatekeeper(gatekeeper.address, gkn1);
      const isGatekeeperResult = await gatewayToken.isGatekeeper(gatekeeper.address, gkn1);

      expect(isGatekeeperResult).to.be.true;
    });

    it('does not add the gatekeeper to other networks', async () => {
      const isGatekeeperResult = await gatewayToken.isGatekeeper(gatekeeper.address, gkn2);

      expect(isGatekeeperResult).to.be.false;
    });
  });

  describe('Test gateway token issuance', async () => {
    it('verified returns false if a token is not yet minted', async () => {
      return expectVerified(alice.address, gkn1).to.be.false;
    });

    it('Successfully mint Gateway Token for Alice by gatekeeper with gatekeeperNetwork = 1', async () => {
      await gatewayToken.connect(gatekeeper).mint(alice.address, gkn1, 0, 0, NULL_CHARGE);

      return expectVerified(alice.address, gkn1).to.be.true;
    });

    it('retrieves tokenId', async () => {
      let tokenId = await gatewayToken.tokenOfOwnerByIndex(alice.address, 0);
      expect(tokenId).to.equal(BigNumber.from(1));
      let tokenOwner = await gatewayToken.ownerOf(1);
      expect(tokenOwner).to.equal(alice.address);
    });

    it('Successfully mint Gateway Token for Alice by gatekeeper with gatekeeperNetwork = 2', async () => {
      // add the gatekeeper to network 2
      await gatewayToken.connect(identityCom).addGatekeeper(gatekeeper.address, gkn2);

      await gatewayToken.connect(gatekeeper).mint(alice.address, gkn2, 0, 0, NULL_CHARGE);

      return expectVerified(alice.address, gkn2).to.be.true;
    });

    it('mint a second token for Alice with gatekeeperNetwork = 1', async () => {
      await gatewayToken.connect(gatekeeper).mint(alice.address, gkn1, 0, 0, NULL_CHARGE);

      return expectVerified(alice.address, gkn2).to.be.true;
    });

    it('get all tokens for a user and network', async () => {
      const aliceTokenIdsGKN1 = await gatewayToken.getTokenIdsByOwnerAndNetwork(alice.address, gkn1);
      expect(aliceTokenIdsGKN1.length).to.equal(2);
      expect(await gatewayToken.ownerOf(aliceTokenIdsGKN1[0])).to.equal(alice.address);
      expect(await gatewayToken.ownerOf(aliceTokenIdsGKN1[1])).to.equal(alice.address);
    });

    it('Try to transfer a token, expect revert', async () => {
      await expect(
        gatewayToken.connect(alice)['transferFrom(address,address,uint256)'](alice.address, bob.address, 1),
      ).to.be.revertedWith('ERC3525: transfer caller is not owner nor approved');
    });

    it('Try to approve transferring a token, expect revert', async () => {
      await expect(
        gatewayToken.connect(alice)['approve(address,uint256)'](bob.address, 1),
      ).to.be.revertedWithCustomError(gatewayToken, 'GatewayToken__TransferDisabled');

      await expect(
        gatewayToken.connect(alice)['approve(uint256,address,uint256)'](1, bob.address, 1),
      ).to.be.revertedWithCustomError(gatewayToken, 'GatewayToken__TransferDisabled');
    });

    it('Try to transfer 1st tokenId by Carol while transfers still restricted', async () => {
      await expect(
        gatewayToken.connect(carol)['safeTransferFrom(address,address,uint256)'](alice.address, alice.address, 1),
      ).to.be.revertedWith('ERC3525: transfer caller is not owner nor approved');
    });
  });

  describe('Test gateway token verification with frozen, active, expired tokens', async () => {
    let aliceTokenIdsGKN1;
    let aliceTokenIdsGKN2;

    before(async () => {
      aliceTokenIdsGKN1 = await gatewayToken.getTokenIdsByOwnerAndNetwork(alice.address, gkn1);
      aliceTokenIdsGKN2 = await gatewayToken.getTokenIdsByOwnerAndNetwork(alice.address, gkn2);
    });

    it('freeze token', async () => {
      await gatewayToken.connect(gatekeeper).freeze(aliceTokenIdsGKN2[0]);

      return expectVerified(alice.address, gkn2).to.be.false;
    });

    it('unfreeze token', async () => {
      await gatewayToken.connect(gatekeeper).unfreeze(aliceTokenIdsGKN2[0]);

      return expectVerified(alice.address, gkn2).to.be.true;
    });

    it('all tokens must be frozen for to verify to return false', async () => {
      await gatewayToken.connect(gatekeeper).freeze(aliceTokenIdsGKN1[0]);

      await expectVerified(alice.address, gkn1).to.be.true;

      await gatewayToken.connect(gatekeeper).freeze(aliceTokenIdsGKN1[1]);

      await expectVerified(alice.address, gkn1).to.be.false;

      await gatewayToken.connect(gatekeeper).unfreeze(aliceTokenIdsGKN1[0]);

      return expectVerified(alice.address, gkn1).to.be.true;
    });

    it('expire token', async () => {
      await gatewayToken
        .connect(gatekeeper)
        .setExpiration(aliceTokenIdsGKN1[0], Date.parse('2020-01-01') / 1000, NULL_CHARGE);

      return expectVerified(alice.address, gkn1).to.be.false;
    });

    it('extend expiry', async () => {
      await gatewayToken
        .connect(gatekeeper)
        .setExpiration(aliceTokenIdsGKN1[0], Date.parse('2222-01-01') / 1000, NULL_CHARGE);

      return expectVerified(alice.address, gkn1).to.be.true;
    });

    it('burn', async () => {
      // burn the second token
      await gatewayToken.connect(gatekeeper).burn(aliceTokenIdsGKN1[1]);

      let validity = await gatewayToken.functions['verifyToken(uint256)'](aliceTokenIdsGKN1[1]);
      expect(validity[0]).to.equal(false);

      // alice still has the other token
      return expectVerified(alice.address, gkn1).to.be.true;
    });
  });

  describe('Bitmask operations', async () => {
    let tokenId;

    before(async () => {
      [tokenId] = await gatewayToken.getTokenIdsByOwnerAndNetwork(alice.address, gkn1);
    });

    it('Test bitmask operations for Alice token', async () => {
      let bitmask = await gatewayToken.getTokenBitmask(tokenId);
      expect(bitmask.toBigInt().toString(2)).to.equal('0');

      const asGatekeeper = gatewayToken.connect(gatekeeper);

      await asGatekeeper.setBitmask(tokenId, 3);

      bitmask = await gatewayToken.getTokenBitmask(tokenId);
      expect(bitmask.toBigInt().toString(2)).to.equal('11');

      await asGatekeeper.setBitmask(tokenId, 0);

      bitmask = await gatewayToken.getTokenBitmask(tokenId);
      expect(bitmask.toBigInt().toString(2)).to.equal('0');
    });
  });

  describe('Test gateway token forwarder functions', async () => {
    it('Checks a forwarder exists', async () => {
      expect(await gatewayToken.isTrustedForwarder(forwarder.address)).to.equal(true);
    });
    it('Successfully add a forwarder', async () => {
      const newForwarder = randomAddress();
      await gatewayToken.connect(identityCom).addForwarder(newForwarder);

      expect(await gatewayToken.isTrustedForwarder(newForwarder)).to.equal(true);
    });

    it('Successfully removes a forwarder', async () => {
      const newForwarder = randomAddress();
      await gatewayToken.connect(identityCom).addForwarder(newForwarder);
      await gatewayToken.connect(identityCom).removeForwarder(newForwarder);

      expect(await gatewayToken.isTrustedForwarder(newForwarder)).to.equal(false);
    });

    it('Successfully forwards a call', async () => {
      const mintTx = await gatewayToken
        .connect(gatekeeper)
        .populateTransaction.mint(carol.address, gkn1, 0, 0, NULL_CHARGE);

      // Carol does not have the GT yet, because the tx has not been sent
      await expectVerified(carol.address, gkn1).to.be.false;

      const input = {
        from: gatekeeper.address,
        to: gatewayToken.address,
        data: mintTx.data as string,
      };
      const { request, signature } = await signMetaTxRequest(gatekeeper, forwarder as IForwarder, input);

      // send the forwarded transaction
      const forwarderTx = await forwarder.connect(alice).execute(request, signature, { gasLimit: 1000000 });
      const receipt = await forwarderTx.wait();
      expect(receipt.status).to.equal(1);

      // carol now has the GT
      await expectVerified(carol.address, gkn1).to.be.true;
    });

    it('protects against reentrancy', async () => {
      // we are going to create a Gateway transaction,
      // then wrap it twice in a forwarder meta-transaction
      // this should fail.
      // although this particular case is harmless, re-entrancy is
      // dangerous in general and this ensures we protect against it.
      const wallet = ethers.Wallet.createRandom();
      const mintTx = await gatewayToken
        .connect(gatekeeper)
        .populateTransaction.mint(wallet.address, gkn1, 0, 0, NULL_CHARGE);

      const input1 = {
        from: gatekeeper.address,
        to: gatewayToken.address,
        data: mintTx.data as string,
      };
      const { request: request1, signature: signature1 } = await signMetaTxRequest(
        gatekeeper,
        forwarder as IForwarder,
        input1,
      );

      const forwarderTx1 = await forwarder
        .connect(alice)
        .populateTransaction.execute(request1, signature1, { gasLimit: 1000000 });
      const input2 = {
        from: alice.address,
        to: forwarder.address,
        data: forwarderTx1.data as string,
      };
      const { request: request2, signature: signature2 } = await signMetaTxRequest(
        alice,
        forwarder as IForwarder,
        input2,
      );

      // attempt to send the forwarded transaction
      const forwarderTx2 = await forwarder.connect(alice).execute(request2, signature2, { gasLimit: 1000000 });
      const receipt = await forwarderTx2.wait();
      expect(receipt.status).to.equal(1);

      // the return value event indicating that the forwarded call failed
      expect(receipt.events.pop().args[0]).to.be.false;

      await expectVerified(wallet.address, gkn1).to.be.false;
    });

    // The forwarder allows two transactions to be sent with the same nonce, as long as they are different
    // this is important for relayer support
    it('Forwards transactions out of sync', async () => {
      // create two transactions, that share the same forwarder nonce
      const tx1 = await gatewayToken
        .connect(gatekeeper)
        .populateTransaction.mint(Wallet.createRandom().address, gkn1, 0, 0, NULL_CHARGE);
      const tx2 = await gatewayToken
        .connect(gatekeeper)
        .populateTransaction.mint(Wallet.createRandom().address, gkn1, 0, 0, NULL_CHARGE);

      const req1 = await makeMetaTx(tx1);
      const req2 = await makeMetaTx(tx2);

      const forwarderTx2 = await forwarder.connect(alice).execute(req2.request, req2.signature, { gasLimit: 1000000 });
      const receipt2 = await forwarderTx2.wait();
      expect(receipt2.status).to.equal(1);

      const forwarderTx1 = await forwarder.connect(alice).execute(req1.request, req1.signature, { gasLimit: 1000000 });
      const receipt1 = await forwarderTx1.wait();
      expect(receipt1.status).to.equal(1);
    });

    // Transactions cannot be replayed. This is important if "out-of-sync" sending is enabled.
    it('Protects against replay attacks', async () => {
      const userToBeFrozen = Wallet.createRandom();
      // mint and freeze a user's token
      await gatewayToken.connect(gatekeeper).mint(userToBeFrozen.address, gkn1, 0, 0, NULL_CHARGE);
      const [tokenId] = await gatewayToken.getTokenIdsByOwnerAndNetwork(userToBeFrozen.address, gkn1);
      await gatewayToken.connect(gatekeeper).freeze(tokenId);
      await expectVerified(userToBeFrozen.address, gkn1).to.be.false;

      // create a forwarded metatx to unfreeze the user
      const unfreezeTx = await gatewayToken.connect(gatekeeper).populateTransaction.unfreeze(tokenId);
      const forwardedUnfreezeTx = await makeMetaTx(unfreezeTx);

      // unfreeze the user, then freeze them again
      await (
        await forwarder
          .connect(alice)
          .execute(forwardedUnfreezeTx.request, forwardedUnfreezeTx.signature, { gasLimit: 1000000 })
      ).wait;
      await gatewayToken.connect(gatekeeper).freeze(tokenId);
      await expectVerified(userToBeFrozen.address, gkn1).to.be.false;

      // cannot replay the unfreeze transaction
      const shouldFail = forwarder
        .connect(alice)
        .execute(forwardedUnfreezeTx.request, forwardedUnfreezeTx.signature, { gasLimit: 1000000 });
      // const shouldFail = attemptedReplayTransactionResponse.wait();
      // expect(attemptedReplayTransactionReceipt.status).to.equal(0);
      await expect(shouldFail).to.be.revertedWithCustomError(forwarder, 'FlexibleNonceForwarder__TxAlreadySeen');
      await expectVerified(userToBeFrozen.address, gkn1).to.be.false;
    });

    // The forwarder allows two transactions to be sent with the same nonce, as long as they are different
    // this is important for relayer support
    it('Rejects old transactions', async () => {
      const forwarderFactory = await ethers.getContractFactory('FlexibleNonceForwarder');
      // this forwarder only accepts transactions whose nonces have been seen in this block
      const intolerantForwarder = await forwarderFactory.deploy(0);
      await intolerantForwarder.deployed();

      // create two transactions,
      const tx1 = await gatewayToken
        .connect(gatekeeper)
        .populateTransaction.mint(Wallet.createRandom().address, gkn1, 0, 0, NULL_CHARGE);
      const tx2 = await gatewayToken
        .connect(gatekeeper)
        .populateTransaction.mint(Wallet.createRandom().address, gkn1, 0, 0, NULL_CHARGE);
      const req1 = await signMetaTxRequest(gatekeeper, intolerantForwarder as IForwarder, {
        from: gatekeeper.address,
        to: gatewayToken.address,
        data: tx1.data as string,
      });
      const req2 = await signMetaTxRequest(gatekeeper, intolerantForwarder as IForwarder, {
        from: gatekeeper.address,
        to: gatewayToken.address,
        data: tx2.data as string,
      });

      // send one now (claiming the nonce) and try to send the next one
      // after a block has passed (executing a tx mines a block on hardhat)
      await intolerantForwarder.connect(alice).execute(req1.request, req1.signature, { gasLimit: 1000000 });

      const shouldFail = intolerantForwarder
        .connect(alice)
        .execute(req2.request, req2.signature, { gasLimit: 1000000 });
      await expect(shouldFail).to.be.revertedWithCustomError(forwarder, 'FlexibleNonceForwarder__TxTooOld');
    });

    it('Refunds excess Eth sent with a transaction', async () => {
      const tx = await gatewayToken
        .connect(gatekeeper)
        .populateTransaction.mint(Wallet.createRandom().address, gkn1, 0, 0, NULL_CHARGE);
      const req = await makeMetaTx(tx);

      const valueInForwardedTransaction = ethers.utils.parseUnits('1', 'ether');
      const gasPrice = ethers.utils.parseUnits('1', 'gwei');

      const initialBalance = await alice.getBalance();
      const forwarderTx = await forwarder
        .connect(alice)
        .execute(req.request, req.signature, { gasPrice, gasLimit: 1_000_000, value: valueInForwardedTransaction });
      const receipt = await forwarderTx.wait();
      const finalBalance = await alice.getBalance();

      // the balance should be reduced by just the gas used. The valueInForwardedTransaction should be refunded
      console.log('gas used', receipt.gasUsed.toString());
      expect(finalBalance).to.equal(initialBalance.sub(receipt.gasUsed.mul(gasPrice)));
    });
  });

  describe('Test gateway token upgradeability', async () => {
    it('upgrades the contract to v2', async () => {
      const gatewayTokenV2Factory = await ethers.getContractFactory('GatewayTokenUpgradeTest');
      await upgrades.upgradeProxy(gatewayToken.address, gatewayTokenV2Factory);
    });

    it('existing tokens are still valid after the upgrade', async () => {
      let verified = await gatewayToken['verifyToken(address,uint256)'](alice.address, gkn1);
      expect(verified).to.be.true;
    });

    it('can issue a token with a positive expiry', async () => {
      const currentDate = Math.ceil(Date.now() / 1000);
      const tomorrow = currentDate + 86_400;

      const wallet = ethers.Wallet.createRandom();
      await gatewayToken.connect(gatekeeper).mint(wallet.address, gkn1, tomorrow, 0, NULL_CHARGE);

      let verified = await gatewayToken['verifyToken(address,uint256)'](wallet.address, gkn1);
      expect(verified).to.be.true;
    });

    it('can no longer issue a token with no expiry (testing the upgraded behaviour)', async () => {
      const wallet = ethers.Wallet.createRandom();

      await expect(gatewayToken.connect(gatekeeper).mint(wallet.address, gkn1, 0, 0, NULL_CHARGE)).to.be.revertedWith(
        'TEST MODE: Expiry must be > zero',
      );
    });
  });
});
