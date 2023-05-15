import { ethers, upgrades } from 'hardhat';
import { BigNumber, Contract, PopulatedTransaction } from 'ethers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { keccak256 } from '@ethersproject/keccak256';
import { toUtf8Bytes } from '@ethersproject/strings';
import { toBytes32 } from './utils';

import { expect } from 'chai';
import { NULL_CHARGE, randomAddress, randomWallet } from './utils/eth';
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
  let gatewayTokenInternalsTest: Contract;

  let hexRetailFlag = toBytes32('Retail');
  let hexInstitutionFlag = toBytes32('Institution');
  let hexAccreditedInvestorFlag = toBytes32('AccreditedInvestor');

  let gkn1 = 10;
  let gkn2 = 20;
  let daoManagedGkn = 30;

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
    const gatewayTokenInternalsTestFactory = await ethers.getContractFactory('GatewayTokenInternalsTest');

    forwarder = await forwarderFactory.deploy(100);
    await forwarder.deployed();

    flagsStorage = await upgrades.deployProxy(flagsStorageFactory, [identityCom.address], { kind: 'uups' });
    await flagsStorage.deployed();

    const args = ['Gateway Protocol', 'GWY', identityCom.address, flagsStorage.address, [forwarder.address]];
    gatewayToken = await upgrades.deployProxy(gatewayTokenFactory, args, { kind: 'uups' });
    await gatewayToken.deployed();

    // Use the internal test contract to test internal functionss
    gatewayTokenInternalsTest = await upgrades.deployProxy(gatewayTokenInternalsTestFactory, args, { kind: 'uups' });
    await gatewayTokenInternalsTest.deployed();

    // create gatekeeper networks
    await gatewayToken.connect(identityCom).createNetwork(gkn1, 'Test GKN 1', false, NULL_ADDRESS);
    await gatewayToken.connect(identityCom).createNetwork(gkn2, 'Test GKN 2', false, NULL_ADDRESS);
  });

  describe('Deployment Tests', async () => {
    describe('gatewayToken', async () => {
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

      it('cannot call initialize after deployment', async () => {
        await expect(
          gatewayToken.initialize('Gateway Protocol', 'GWY', identityCom.address, flagsStorage.address, [
            forwarder.address,
          ]),
        ).to.be.revertedWith(/Initializable: contract is already initialized/);
      });
    });

    describe('flagsStorage', async () => {
      it('cannot call initialize after deployment', async () => {
        await expect(flagsStorage.initialize(identityCom.address)).to.be.revertedWith(
          /Initializable: contract is already initialized/,
        );
      });

      it('cannot call initialize with a null superAdmin', async () => {
        const flagsStorageFactory = await ethers.getContractFactory('FlagsStorage');
        await expect(
          upgrades.deployProxy(flagsStorageFactory, [NULL_ADDRESS], { kind: 'uups' }),
        ).to.be.revertedWithCustomError(flagsStorage, 'Common__MissingAccount');
      });
    });
  });

  describe('Gatekeeper Networks', async () => {
    it('Get gatekeeper network by id', async () => {
      let network = await gatewayToken.getNetwork(gkn1);
      expect(network).to.equal('Test GKN 1');
    });

    it('rename gatekeeper network - reverts if unauthorized', async () => {
      await expect(gatewayToken.connect(alice).renameNetwork(gkn1, 'Test GKN 1 Renamed')).to.be.revertedWithCustomError(
        gatewayToken,
        'Common__Unauthorized',
      );
    });

    it('rename gatekeeper network - reverts if network does not exist', async () => {
      await expect(
        gatewayToken.connect(alice).renameNetwork(11111, 'Test GKN 1 Renamed'),
      ).to.be.revertedWithCustomError(gatewayToken, 'GatewayToken__NetworkDoesNotExist');
    });

    it('rename gatekeeper network', async () => {
      const newName = 'Test GKN 1 Renamed';
      await gatewayToken.connect(identityCom).renameNetwork(gkn1, newName);
      let network = await gatewayToken.getNetwork(gkn1);
      expect(network).to.equal(newName);
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
    it('add flag, revert if not super admin', async () => {
      await expect(flagsStorage.connect(bob).addFlag(hexRetailFlag, 0)).to.be.revertedWithCustomError(
        gatewayToken,
        'Common__NotSuperAdmin',
      );
    });

    it('add flag by superadmin, expect success', async () => {
      await flagsStorage.connect(identityCom).addFlag(hexRetailFlag, 0);
    });

    it('add several flags, revert if not super admin', async () => {
      let flagCodes = [hexInstitutionFlag, hexAccreditedInvestorFlag];
      let indexArray = [1, 2];

      await expect(flagsStorage.connect(bob).addFlags(flagCodes, indexArray)).to.be.revertedWithCustomError(
        flagsStorage,
        'Common__NotSuperAdmin',
      );
    });

    it('add several flags, index array wrong length, revert', async () => {
      let flagCodes = [hexInstitutionFlag, hexAccreditedInvestorFlag];
      let indexArrayTooSmall = [1];

      await expect(
        flagsStorage.connect(identityCom).addFlags(flagCodes, indexArrayTooSmall),
      ).to.be.revertedWithCustomError(flagsStorage, 'FlagsStorage__IncorrectVariableLength');
    });

    it('add several flags by superadmin, expect success', async () => {
      let flagCodes = [hexInstitutionFlag, hexAccreditedInvestorFlag];
      let indexArray = [1, 2];

      await flagsStorage.connect(identityCom).addFlags(flagCodes, indexArray);
    });

    it('add new flag at already used index - revert', async () => {
      await expect(flagsStorage.addFlag(hexRetailFlag, 3)).to.be.revertedWithCustomError(
        flagsStorage,
        'FlagsStorage__FlagAlreadyExists',
      );
    });

    it('add existing flag - revert', async () => {
      await expect(flagsStorage.addFlag(hexRetailFlag, 0)).to.be.revertedWithCustomError(
        flagsStorage,
        'FlagsStorage__IndexAlreadyUsed',
      );
    });

    it('remove flag, revert if not superAdmin', async () => {
      await expect(flagsStorage.connect(bob).removeFlag(hexRetailFlag)).to.be.revertedWithCustomError(
        flagsStorage,
        'Common__NotSuperAdmin',
      );
    });

    it('remove flag, revert if not supported', async () => {
      await expect(
        flagsStorage.connect(identityCom).removeFlag(toBytes32('unknownFlag')),
      ).to.be.revertedWithCustomError(flagsStorage, 'FlagsStorage__FlagNotSupported');
    });

    it('remove flag', async () => {
      const tempFlag = toBytes32('tempFlag');
      await flagsStorage.connect(identityCom).addFlag(tempFlag, 3);
      expect(await flagsStorage.isFlagSupported(tempFlag)).to.be.true;

      await flagsStorage.connect(identityCom).removeFlag(tempFlag);
      expect(await flagsStorage.isFlagSupported(tempFlag)).to.be.false;
    });

    it('remove flags', async () => {
      const tempFlags = [toBytes32('tempFlag1'), toBytes32('tempFlag2')];
      await flagsStorage.connect(identityCom).addFlags(tempFlags, [3, 4]);
      expect(await flagsStorage.isFlagSupported(tempFlags[0])).to.be.true;
      expect(await flagsStorage.isFlagSupported(tempFlags[1])).to.be.true;

      await flagsStorage.connect(identityCom).removeFlags(tempFlags);
      expect(await flagsStorage.isFlagSupported(tempFlags[0])).to.be.false;
      expect(await flagsStorage.isFlagSupported(tempFlags[1])).to.be.false;
    });

    it('remove flags - revert if not superAdmin', async () => {
      const tempFlags = [toBytes32('tempFlag1'), toBytes32('tempFlag2')];
      await expect(flagsStorage.connect(bob).removeFlags(tempFlags)).to.be.revertedWithCustomError(
        flagsStorage,
        'Common__NotSuperAdmin',
      );
    });

    it('remove flags - revert if flags not present', async () => {
      const tempFlags = [toBytes32('tempFlag1'), toBytes32('tempFlag2')];
      await expect(flagsStorage.connect(identityCom).removeFlags(tempFlags)).to.be.revertedWithCustomError(
        flagsStorage,
        'FlagsStorage__FlagNotSupported',
      );
    });

    it('Sets a new flag storage contract - reverts if not authorized', async () => {
      const flagsStorageFactory = await ethers.getContractFactory('FlagsStorage');
      const flagsStorage2 = await upgrades.deployProxy(flagsStorageFactory, [identityCom.address], { kind: 'uups' });
      await flagsStorage2.deployed();

      await expect(gatewayToken.connect(bob).updateFlagsStorage(flagsStorage2.address)).to.be.revertedWithCustomError(
        gatewayToken,
        'Common__NotSuperAdmin',
      );
    });

    it('sets a new flag storage contract', async () => {
      const flagsStorageFactory = await ethers.getContractFactory('FlagsStorage');
      const flagsStorage2 = await upgrades.deployProxy(flagsStorageFactory, [identityCom.address], { kind: 'uups' });
      await flagsStorage2.deployed();

      await gatewayToken.updateFlagsStorage(flagsStorage2.address);

      expect(await gatewayToken.flagsStorage()).to.equal(flagsStorage2.address);
    });

    it('updates the flags storage super admin - reverts if not authorized', async () => {
      await expect(flagsStorage.connect(bob).updateSuperAdmin(bob.address)).to.be.revertedWithCustomError(
        flagsStorage,
        'Common__NotSuperAdmin',
      );
    });

    it('updates the flags storage super admin - reverts if new superadmin is null address', async () => {
      await expect(flagsStorage.updateSuperAdmin(NULL_ADDRESS)).to.be.revertedWithCustomError(
        flagsStorage,
        'Common__MissingAccount',
      );
    });

    it('updates the flags storage super admin', async () => {
      // give bob the super admin role
      await flagsStorage.updateSuperAdmin(bob.address);
      expect(await flagsStorage.superAdmin()).to.equal(bob.address);

      // send it back
      await flagsStorage.connect(bob).updateSuperAdmin(identityCom.address);
      expect(await flagsStorage.superAdmin()).to.equal(identityCom.address);
    });
  });

  describe('super-admin', async () => {
    it('set and revoke super admin', async () => {
      await gatewayToken.connect(identityCom).setSuperAdmin(alice.address);
      expect(await gatewayToken.isSuperAdmin(alice.address)).to.be.true;

      await gatewayToken.connect(identityCom).revokeSuperAdmin(alice.address);
      expect(await gatewayToken.isSuperAdmin(alice.address)).to.be.false;
    });
  });

  describe('network authorities', async () => {
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

  describe('RBAC', () => {
    it('renounce role', async () => {
      // add bob as a gatekeeper
      await gatewayToken.connect(identityCom).addGatekeeper(bob.address, gkn1);
      // bob renounces
      await gatewayToken.connect(bob).renounceRole(keccak256(toUtf8Bytes('GATEKEEPER_ROLE')), gkn1, bob.address);
    });
  });

  describe('Add and remove Gatekeeper', () => {
    it('can add a gatekeeper', async () => {
      await gatewayToken.connect(identityCom).addGatekeeper(gatekeeper.address, gkn1);
      const isGatekeeperResult = await gatewayToken.isGatekeeper(gatekeeper.address, gkn1);

      expect(isGatekeeperResult).to.be.true;
    });

    it('does not add the gatekeeper to other networks', async () => {
      const isGatekeeperResult = await gatewayToken.isGatekeeper(gatekeeper.address, gkn2);

      expect(isGatekeeperResult).to.be.false;
    });

    it('can remove a gatekeeper', async () => {
      const dummyGatekeeper = randomAddress();
      await gatewayToken.connect(identityCom).addGatekeeper(dummyGatekeeper, gkn1);
      expect(await gatewayToken.isGatekeeper(dummyGatekeeper, gkn1)).to.be.true;

      await gatewayToken.connect(identityCom).removeGatekeeper(dummyGatekeeper, gkn1);
      expect(await gatewayToken.isGatekeeper(dummyGatekeeper, gkn1)).to.be.false;
    });
  });

  describe('Test gateway token issuance', async () => {
    it('verified returns false if a token is not yet minted', async () => {
      return expectVerified(alice.address, gkn1).to.be.false;
    });

    it('mint Gateway Token for Alice by gatekeeper with gatekeeperNetwork = 1', async () => {
      await gatewayToken.connect(gatekeeper).mint(alice.address, gkn1, 0, 0, NULL_CHARGE);

      return expectVerified(alice.address, gkn1).to.be.true;
    });

    it('verified returns false if for a different gatekeeper network', async () => {
      return expectVerified(alice.address, gkn2).to.be.false;
    });

    it('retrieves tokenId', async () => {
      const tokenId = await gatewayToken.tokenOfOwnerByIndex(alice.address, 0);
      expect(tokenId).to.equal(BigNumber.from(1));
      let tokenOwner = await gatewayToken.ownerOf(1);
      expect(tokenOwner).to.equal(alice.address);
    });

    it('retrieves token by tokenId', async () => {
      const tokenId = await gatewayToken.tokenOfOwnerByIndex(alice.address, 0);
      const token = await gatewayToken.getToken(tokenId);
      expect(token.owner).to.equal(alice.address);
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

    it('Mint a token with a bitmask', async () => {
      const expectedBitmask = 1;
      const dummyWallet = randomAddress();
      await gatewayToken.connect(gatekeeper).mint(dummyWallet, gkn1, 0, expectedBitmask, NULL_CHARGE);

      const [dummyWalletTokenId] = await gatewayToken.getTokenIdsByOwnerAndNetwork(dummyWallet, gkn1);
      const bitmask = await gatewayToken.getTokenBitmask(dummyWalletTokenId);

      expect(bitmask).to.equal(expectedBitmask);
    });

    it('Mint a token with an expiration', async () => {
      const dummyWallet = randomAddress();
      const expectedExpiration = Date.parse('2222-01-01') / 1000;
      await gatewayToken.connect(gatekeeper).mint(dummyWallet, gkn1, expectedExpiration, 0, NULL_CHARGE);

      const [dummyWalletTokenId] = await gatewayToken.getTokenIdsByOwnerAndNetwork(dummyWallet, gkn1);
      const expiration = await gatewayToken.getExpiration(dummyWalletTokenId);

      expect(expiration).to.equal(expectedExpiration);
    });
  });

  describe('Test Gated modifier', async () => {
    let client: Contract;

    before(async () => {
      const clientFactory = await ethers.getContractFactory('GatewayTokenClientTest');
      client = await clientFactory.deploy(gatewayToken.address, gkn1);
    });

    it('approves the user if they have a gateway token', async () => {
      // Alice is verified
      await expect(client.connect(alice).testGated()).to.emit(client, 'Success');
    });

    it('rejects the user if they do not have a gateway token', async () => {
      // Carol is not verified
      await expect(client.connect(carol).testGated()).to.be.revertedWithCustomError(
        client,
        'IsGated__InvalidGatewayToken',
      );
    });
  });

  describe('Test gateway token operations: freeze, unfreeze, setExpiration, revoke', async () => {
    let dummyWallet: string;
    let dummyWalletTokenId: number;

    beforeEach(async () => {
      dummyWallet = randomAddress();
      await gatewayToken.connect(gatekeeper).mint(dummyWallet, gkn1, 0, 0, NULL_CHARGE);

      [dummyWalletTokenId] = await gatewayToken.getTokenIdsByOwnerAndNetwork(dummyWallet, gkn1);
    });

    it('freeze token', async () => {
      await gatewayToken.connect(gatekeeper).freeze(dummyWalletTokenId);

      return expectVerified(dummyWallet, gkn1).to.be.false;
    });

    it('freeze token - revert if already frozen', async () => {
      await gatewayToken.connect(gatekeeper).freeze(dummyWalletTokenId);

      await expect(gatewayToken.connect(gatekeeper).freeze(dummyWalletTokenId)).to.be.revertedWithCustomError(
        gatewayToken,
        'GatewayToken__TokenDoesNotExistOrIsInactive',
      );
    });

    it('unfreeze token', async () => {
      await gatewayToken.connect(gatekeeper).freeze(dummyWalletTokenId);

      await gatewayToken.connect(gatekeeper).unfreeze(dummyWalletTokenId);

      return expectVerified(alice.address, gkn2).to.be.true;
    });

    it('unfreeze token - revert if not frozen', async () => {
      await expect(gatewayToken.connect(gatekeeper).unfreeze(dummyWalletTokenId)).to.be.revertedWithCustomError(
        gatewayToken,
        'GatewayToken__TokenInvalidStateForOperation',
      );
    });

    it('all tokens must be frozen for to verify to return false', async () => {
      // mint a second token
      await gatewayToken.connect(gatekeeper).mint(dummyWallet, gkn1, 0, 0, NULL_CHARGE);
      const dummyWalletTokenIds = await gatewayToken.getTokenIdsByOwnerAndNetwork(alice.address, gkn1);

      await gatewayToken.connect(gatekeeper).freeze(dummyWalletTokenIds[0]);

      await expectVerified(alice.address, gkn1).to.be.true;

      await gatewayToken.connect(gatekeeper).freeze(dummyWalletTokenIds[1]);

      await expectVerified(alice.address, gkn1).to.be.false;

      await gatewayToken.connect(gatekeeper).unfreeze(dummyWalletTokenIds[0]);

      return expectVerified(alice.address, gkn1).to.be.true;
    });

    it('expire token', async () => {
      await gatewayToken
        .connect(gatekeeper)
        .setExpiration(dummyWalletTokenId, Date.parse('2020-01-01') / 1000, NULL_CHARGE);

      const currentExpiration = await gatewayToken.getExpiration(dummyWalletTokenId);
      expect(currentExpiration).to.equal(Date.parse('2020-01-01') / 1000);

      return expectVerified(dummyWallet, gkn1).to.be.false;
    });

    it('extend expiry', async () => {
      await gatewayToken
        .connect(gatekeeper)
        .setExpiration(dummyWalletTokenId, Date.parse('2222-01-01') / 1000, NULL_CHARGE);

      const currentExpiration = await gatewayToken.getExpiration(dummyWalletTokenId);
      expect(currentExpiration).to.equal(Date.parse('2222-01-01') / 1000);

      return expectVerified(dummyWallet, gkn1).to.be.true;
    });

    it('get expiration - reverts if the token does not exist', async () => {
      await expect(gatewayToken.getExpiration(123456789)).to.be.revertedWithCustomError(
        gatewayToken,
        'GatewayToken__TokenDoesNotExist',
      );
    });

    it('burn', async () => {
      await gatewayToken.connect(gatekeeper).burn(dummyWalletTokenId);
      return expectVerified(dummyWallet, gkn1).to.be.false;
    });

    it('all tokens must be burned for verified to return false', async () => {
      // mint a second token
      await gatewayToken.connect(gatekeeper).mint(dummyWallet, gkn1, 0, 0, NULL_CHARGE);
      const dummyWalletTokenIds = await gatewayToken.getTokenIdsByOwnerAndNetwork(dummyWallet, gkn1);

      await gatewayToken.connect(gatekeeper).burn(dummyWalletTokenIds[0]);

      // the wallet still has the other token
      return expectVerified(dummyWallet, gkn1).to.be.true;
    });

    it('revoke a token', async () => {
      await gatewayToken.connect(gatekeeper).revoke(dummyWalletTokenId);
      return expectVerified(dummyWallet, gkn1).to.be.false;
    });

    it('all tokens must be revoked for verified to return false', async () => {
      // mint a second token
      await gatewayToken.connect(gatekeeper).mint(dummyWallet, gkn1, 0, 0, NULL_CHARGE);
      const dummyWalletTokenIds = await gatewayToken.getTokenIdsByOwnerAndNetwork(dummyWallet, gkn1);

      await gatewayToken.connect(gatekeeper).revoke(dummyWalletTokenIds[0]);

      let validity = await gatewayToken.functions['verifyToken(uint256)'](dummyWalletTokenIds[0]);
      expect(validity[0]).to.equal(false);

      // the wallet still has the other token
      return expectVerified(dummyWallet, gkn1).to.be.true;
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
    it('add a forwarder', async () => {
      const newForwarder = randomAddress();
      await gatewayToken.connect(identityCom).addForwarder(newForwarder);

      expect(await gatewayToken.isTrustedForwarder(newForwarder)).to.equal(true);
    });

    it('add a forwarder - reverts if not superadmin', async () => {
      const newForwarder = randomAddress();

      await expect(gatewayToken.connect(alice).addForwarder(newForwarder)).to.be.revertedWithCustomError(
        gatewayToken,
        'Common__NotSuperAdmin',
      );
    });

    it('remove a forwarder', async () => {
      const newForwarder = randomAddress();
      await gatewayToken.connect(identityCom).addForwarder(newForwarder);
      expect(await gatewayToken.isTrustedForwarder(newForwarder)).to.equal(true);

      await gatewayToken.connect(identityCom).removeForwarder(newForwarder);
      expect(await gatewayToken.isTrustedForwarder(newForwarder)).to.equal(false);
    });

    it('remove a forwarder - reverts if not superadmin', async () => {
      const newForwarder = randomAddress();
      await gatewayToken.connect(identityCom).addForwarder(newForwarder);

      await expect(gatewayToken.connect(alice).removeForwarder(newForwarder)).to.be.revertedWithCustomError(
        gatewayToken,
        'Common__NotSuperAdmin',
      );
    });

    it('forward a call', async () => {
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

    it('forward a call - revert if the signer is not the from address', async () => {
      const mintTx = await gatewayToken
        .connect(gatekeeper)
        .populateTransaction.mint(randomAddress(), gkn1, 0, 0, NULL_CHARGE);

      const input = {
        from: gatekeeper.address,
        to: gatewayToken.address,
        data: mintTx.data as string,
      };
      const { request, signature } = await signMetaTxRequest(
        bob, // bob is not the gatekeeper
        forwarder as IForwarder,
        input,
      );

      // send the forwarded transaction
      await expect(
        forwarder.connect(alice).execute(request, signature, { gasLimit: 1000000 }),
      ).to.be.revertedWithCustomError(forwarder, 'FlexibleNonceForwarder__InvalidSigner');
    });

    it('protects against reentrancy', async () => {
      // we are going to create a Gateway transaction,
      // then wrap it twice in a forwarder meta-transaction
      // this should fail.
      // although this particular case is harmless, re-entrancy is
      // dangerous in general and this ensures we protect against it.
      const wallet = randomWallet();
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
        .populateTransaction.mint(randomAddress(), gkn1, 0, 0, NULL_CHARGE);
      const tx2 = await gatewayToken
        .connect(gatekeeper)
        .populateTransaction.mint(randomAddress(), gkn1, 0, 0, NULL_CHARGE);

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
      const userToBeFrozen = randomWallet();
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
        .populateTransaction.mint(randomAddress(), gkn1, 0, 0, NULL_CHARGE);
      const tx2 = await gatewayToken
        .connect(gatekeeper)
        .populateTransaction.mint(randomAddress(), gkn1, 0, 0, NULL_CHARGE);
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
        .populateTransaction.mint(randomAddress(), gkn1, 0, 0, NULL_CHARGE);
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

    it('Exposes the correct message data when forwarding a transaction', async () => {
      await expect(gatewayTokenInternalsTest.getMsgData(1)).to.emit(gatewayTokenInternalsTest, 'MsgData');

      const txIndirect = await gatewayTokenInternalsTest.connect(gatekeeper).populateTransaction.getMsgData(1);

      const req = await signMetaTxRequest(gatekeeper, forwarder as IForwarder, {
        from: gatekeeper.address,
        // specify the internals test contract here instead of gatewayToken
        to: gatewayTokenInternalsTest.address,
        data: txIndirect.data as string,
      });
      await expect(forwarder.connect(alice).execute(req.request, req.signature)).to.emit(
        gatewayTokenInternalsTest,
        'MsgData',
      );
    });

    it('Exposes the correct message sender when forwarding a transaction', async () => {
      await expect(gatewayTokenInternalsTest.connect(gatekeeper).getMsgSender())
        .to.emit(gatewayTokenInternalsTest, 'MsgSender')
        .withArgs(gatekeeper.address);

      const txIndirect = await gatewayTokenInternalsTest.connect(gatekeeper).populateTransaction.getMsgSender();

      const req = await signMetaTxRequest(gatekeeper, forwarder as IForwarder, {
        from: gatekeeper.address,
        // specify the internals test contract here instead of gatewayToken
        to: gatewayTokenInternalsTest.address,
        data: txIndirect.data as string,
      });
      await expect(forwarder.connect(alice).execute(req.request, req.signature))
        .to.emit(gatewayTokenInternalsTest, 'MsgSender')
        .withArgs(gatekeeper.address);
    });

    // forwarding reserves 63 gas for the forwarder to use. If the gas limit is less than 63 more than the target
    // transaction, the transaction will fail
    it('reverts if the gas limit less than 63 more than the target transaction', async () => {
      // create two transactions, that share the same forwarder nonce
      const tx1 = await gatewayToken
        .connect(gatekeeper)
        .populateTransaction.mint(randomAddress(), gkn1, 0, 0, NULL_CHARGE);
      const req1 = await makeMetaTx(tx1);
      // 25560 is what is reported by the evm as needed
      // 60 is not enough for the forwarder to do its work
      await expect(forwarder.connect(alice).execute(req1.request, req1.signature, { gasLimit: 25560 + 60 })).to.be
        .reverted;
    });

    it('Authorizes an upgrade via a forwarder', async () => {
      // identityCom can authorize an upgrade
      await expect(gatewayTokenInternalsTest.connect(identityCom).authorizedUpgrade()).to.emit(
        gatewayTokenInternalsTest,
        'AuthorizedUpgrade',
      );

      // gatekeeper cannot authorize an upgrade
      await expect(gatewayTokenInternalsTest.connect(gatekeeper).authorizedUpgrade()).to.be.revertedWithCustomError(
        gatewayTokenInternalsTest,
        'Common__NotSuperAdmin',
      );

      // identityCom can authorize an upgrade (forwarded via Alice)
      const txIndirect = await gatewayTokenInternalsTest.connect(identityCom).populateTransaction.authorizedUpgrade();
      const req = await signMetaTxRequest(identityCom, forwarder as IForwarder, {
        from: identityCom.address,
        // specify the internals test contract here instead of gatewayToken
        to: gatewayTokenInternalsTest.address,
        data: txIndirect.data as string,
      });
      await expect(forwarder.connect(alice).execute(req.request, req.signature)).to.emit(
        gatewayTokenInternalsTest,
        'AuthorizedUpgrade',
      );
    });
  });

  describe('DAO Management', () => {
    let multisigWallet1: Contract;
    let multisigWallet2: Contract;

    before('deploy multisig wallets', async () => {
      const stubMultisigWalletFactory = await ethers.getContractFactory('StubMultisig');
      multisigWallet1 = await stubMultisigWalletFactory.deploy(gatewayToken.address, daoManagedGkn);
      multisigWallet2 = await stubMultisigWalletFactory.deploy(gatewayToken.address, daoManagedGkn);
    });

    it('create a dao-managed network', async () => {
      await gatewayToken
        .connect(identityCom)
        .createNetwork(daoManagedGkn, 'DAO-managed GKN', true, multisigWallet1.address);
    });

    it('create a dao-managed network - revert if the network already exists', async () => {
      await expect(
        gatewayToken
          .connect(identityCom)
          .createNetwork(daoManagedGkn, 'DAO-managed GKN', true, multisigWallet1.address),
      ).to.be.revertedWithCustomError(gatewayToken, 'GatewayToken__NetworkAlreadyExists');
    });

    it('create a dao-managed network - revert if the dao manager is not a contract', async () => {
      const nonContractAddress = randomAddress();
      await expect(
        gatewayToken.connect(identityCom).createNetwork(12345, 'DAO-managed GKN', true, nonContractAddress),
      ).to.be.revertedWithCustomError(gatewayToken, 'Common__NotContract');
    });

    it('verifies management role', async () => {
      const isMultisig1DaoManager = await gatewayToken.hasRole(
        keccak256(toUtf8Bytes('DAO_MANAGER_ROLE')),
        daoManagedGkn,
        multisigWallet1.address,
      );

      expect(isMultisig1DaoManager).to.be.true;

      const isMultisig2DaoManager = await gatewayToken.hasRole(
        keccak256(toUtf8Bytes('DAO_MANAGER_ROLE')),
        daoManagedGkn,
        multisigWallet2.address,
      );

      expect(isMultisig2DaoManager).to.be.false;
    });

    it('fails to create a dao-managed network with a NULL_ADDRESS', async () => {
      await expect(
        gatewayToken.connect(identityCom).createNetwork(40, 'AnotherDAO-managed GKN', true, NULL_ADDRESS),
      ).to.be.revertedWithCustomError(gatewayToken, 'Common__MissingAccount');
    });

    it('transfer DAO management to a new multisig - reverts if not dao-managed', async () => {
      await expect(
        gatewayToken.connect(alice).transferDAOManager(multisigWallet1.address, multisigWallet2.address, gkn1),
      ).to.be.revertedWithCustomError(gatewayToken, 'GatewayToken__NotDAOGoverned');
    });

    it('transfer DAO management to a new multisig - reverts if called directly', async () => {
      await expect(
        gatewayToken.connect(alice).transferDAOManager(multisigWallet1.address, multisigWallet2.address, daoManagedGkn),
      ).to.be.revertedWithCustomError(gatewayToken, 'Common__Unauthorized');
    });

    it('transfer DAO management to a new multisig - reverts if the new manager is missing', async () => {
      await expect(
        gatewayToken.connect(alice).transferDAOManager(multisigWallet1.address, NULL_ADDRESS, daoManagedGkn),
      ).to.be.revertedWithCustomError(gatewayToken, 'Common__MissingAccount');
    });

    it('transfers DAO management to a new multisig', async () => {
      // Note, the multisig wallet (using a stub here) is responsible for authorising the caller.
      // since we are using a stub, anyone can call it here.
      await (await multisigWallet1.connect(alice).reassignOwnership(multisigWallet2.address)).wait();
    });
  });

  describe('Internals', () => {
    const INTERFACE_ID_IERC165 = '0x01ffc9a7';
    const INTERFACE_ID_IERC3525 = '0xd5358140';
    const INTERFACE_ID_IERC721 = '0x80ac58cd';
    const INTERFACE_ID_IERC3525MetadataUpgradeable = '0xe1600902';
    const INTERFACE_ID_ERC20 = '0x36372b07';
    const INTERFACE_ID_IParameterizedAccessControl = '0x6796e9ea';

    it('supports the ERC165 interface', async () => {
      const supportsErc721 = await gatewayToken.supportsInterface(INTERFACE_ID_IERC721);
      const supportsErc3525 = await gatewayToken.supportsInterface(INTERFACE_ID_IERC3525);
      const supportsErc3525MetadataUpgradeable = await gatewayToken.supportsInterface(
        INTERFACE_ID_IERC3525MetadataUpgradeable,
      );
      const supportsParameterizedAccessControl = await gatewayToken.supportsInterface(
        INTERFACE_ID_IParameterizedAccessControl,
      );
      const supportsErc165 = await gatewayToken.supportsInterface(INTERFACE_ID_IERC165);
      // negative case
      const supportsErc20 = await gatewayToken.supportsInterface(INTERFACE_ID_ERC20);

      expect(supportsErc721).to.be.true;
      expect(supportsErc3525).to.be.true;
      expect(supportsErc3525MetadataUpgradeable).to.be.true;
      // via the ParameterizedAccessControl superclass
      expect(supportsParameterizedAccessControl).to.be.true;
      expect(supportsErc165).to.be.true;
      // does not match the ERC20 interface
      expect(supportsErc20).to.be.false;
    });

    it('set a metadata descriptor', async () => {
      const metadataDescriptor = randomAddress();
      await gatewayToken.connect(identityCom).setMetadataDescriptor(metadataDescriptor);
      expect(await gatewayToken.metadataDescriptor()).to.equal(metadataDescriptor);
    });

    it('set a metadata descriptor - revert if not superadmin', async () => {
      const metadataDescriptor = randomAddress();
      await expect(gatewayToken.connect(alice).setMetadataDescriptor(metadataDescriptor)).to.be.revertedWithCustomError(
        gatewayToken,
        'Common__NotSuperAdmin',
      );
    });

    it('restricts all transfers', async () => {
      expect(await gatewayToken.transfersRestricted()).to.be.true;
    });
  });

  describe('Test gateway token upgradeability', async () => {
    it('upgrades the gateway token contract to v2', async () => {
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

      const wallet = randomWallet();
      await gatewayToken.connect(gatekeeper).mint(wallet.address, gkn1, tomorrow, 0, NULL_CHARGE);

      let verified = await gatewayToken['verifyToken(address,uint256)'](wallet.address, gkn1);
      expect(verified).to.be.true;
    });

    it('can no longer issue a token with no expiry (testing the upgraded behaviour)', async () => {
      const wallet = randomWallet();

      await expect(gatewayToken.connect(gatekeeper).mint(wallet.address, gkn1, 0, 0, NULL_CHARGE)).to.be.revertedWith(
        'TEST MODE: Expiry must be > zero',
      );
    });

    it('upgrades the flags storage contract to v2', async () => {
      // just using the same contract here, to test the upgradeability feature
      const flagsStorageV2Factory = await ethers.getContractFactory('FlagsStorage');
      await upgrades.upgradeProxy(flagsStorage.address, flagsStorageV2Factory);
    });

    it('upgrades the flags storage contract to v2 - reverts if not superadmin', async () => {
      // just using the same contract here, to test the upgradeability feature
      const flagsStorageV2Factory = await ethers.getContractFactory('FlagsStorage');
      await expect(
        upgrades.upgradeProxy(flagsStorage.address, flagsStorageV2Factory.connect(bob)),
      ).to.be.revertedWithCustomError(gatewayToken, 'Common__NotSuperAdmin');
    });
  });
});
