import { ethers, upgrades } from 'hardhat';
import { BigNumber, BigNumberish, Contract, PopulatedTransaction, utils } from 'ethers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { keccak256 } from '@ethersproject/keccak256';
import { toUtf8Bytes } from '@ethersproject/strings';
import { toBytes32 } from './utils';

import { expect } from 'chai';
import { NULL_CHARGE, randomAddress, randomWallet, ZERO_ADDRESS } from './utils/eth';
import { signMetaTxRequest } from '../../gateway-eth-ts/src/utils/metatx';
import { Gated, IForwarder, IGatewayGatekeeper, IGatewayNetwork } from '../typechain-types';
import { TransactionReceipt } from '@ethersproject/providers';
import { 
  GatewayNetwork, 
  GatewayNetwork__factory, 
  Gatekeeper, 
  Gatekeeper__factory,
  GatewayStaking,
  GatewayStaking__factory,
  DummyERC20,
  DummyERC20__factory,
  ChargeHandler
} from '../typechain-types' ;

describe('GatewayToken', async () => {
  let identityCom: SignerWithAddress;
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;
  let carol: SignerWithAddress;
  let gatekeeper: SignerWithAddress;
  let gatewayStakingContract: GatewayStaking;
  let dummyErc20Contract: DummyERC20;

  let forwarder: Contract;
  let flagsStorage: Contract;
  let chargeHandler: ChargeHandler;
  let gatewayToken: Contract;
  let gatewayTokenInternalsTest: Contract;
  let gatewayNetwork: GatewayNetwork;
  let gatekeeperContract: Gatekeeper;

  let hexRetailFlag = toBytes32('Retail');
  let hexInstitutionFlag = toBytes32('Institution');
  let hexAccreditedInvestorFlag = toBytes32('AccreditedInvestor');

  let gkn1;
  let gkn2;
  let gkn3;

  const expectVerified = (address: string, gkn: number): Chai.PromisedAssertion => {
    const verified = gatewayToken['verifyToken(address,uint256)'](address, gkn);
    return expect(verified).eventually;
  };

  const makeMetaTx = (tx: PopulatedTransaction) =>
    signMetaTxRequest(gatekeeper, forwarder as IForwarder, {
      from: gatekeeper.address,
      to: gatewayToken.address,
      data: tx.data as string,
      gas: 500_000,
    });

  const makeWeiCharge = (value: BigNumber) => ({
    token: ZERO_ADDRESS,
    chargeType: 1,
    value,
    networkFeeBps: 0,
    partiesInCharge: {
      recipient: gatekeeper.address,
      tokenSender: ZERO_ADDRESS,
    }
  });

  const makeERC20Charge = (value: BigNumber, token: string, tokenSender: string) => ({
    token,
    chargeType: 2,
    value,
    networkFeeBps: 0,
    partiesInCharge: {
      recipient: gatekeeper.address,
      tokenSender,
    }
  });

  const getNetwork = (primaryAuthority: string, name: string, supportedToken?: string, gatekeepers?: string[], passExpireDurationInSeconds?: number): IGatewayNetwork.GatekeeperNetworkDataStruct => {
    return {
        primaryAuthority,
        name: utils.formatBytes32String(name),
        passExpireDurationInSeconds: passExpireDurationInSeconds ? passExpireDurationInSeconds : 100000000,
        networkFeatureMask: 0,
        networkFee: {verificationFee: 0, issueFee: 0, refreshFee: 0, expireFee: 0},
        supportedToken: supportedToken ? supportedToken : ZERO_ADDRESS,
        gatekeepers: gatekeepers ? gatekeepers : [],
        lastFeeUpdateTimestamp: 0
    }
  }

  const giveDummyToken = async (account: SignerWithAddress, amountToTransfer: BigNumberish) => {
    await dummyErc20Contract.connect(identityCom).transfer(account.address, amountToTransfer);
  }

  before('deploy contracts', async () => {
    [identityCom, alice, bob, carol, gatekeeper] = await ethers.getSigners();

    const forwarderFactory = await ethers.getContractFactory('FlexibleNonceForwarder');
    const flagsStorageFactory = await ethers.getContractFactory('FlagsStorage');
    const chargeHandlerFactory = await ethers.getContractFactory('ChargeHandler');
    const gatewayTokenFactory = await ethers.getContractFactory('GatewayToken');
    const gatewayTokenInternalsTestFactory = await ethers.getContractFactory('GatewayTokenInternalsTest');
    const gatewayNetworkFactory = await new GatewayNetwork__factory(identityCom);
    const gatekeeperContractFactory = await new Gatekeeper__factory(identityCom);
    const gatewayStakingFactory = await new GatewayStaking__factory(identityCom);
    const dummyERC20Factory = await new DummyERC20__factory(identityCom);

    forwarder = await forwarderFactory.deploy(100);
    await forwarder.deployed();

    gatekeeperContract = await gatekeeperContractFactory.deploy();
    await gatekeeperContract.deployed();

    dummyErc20Contract = await dummyERC20Factory.deploy('DummyToken', 'DT', 10000000000, identityCom.address);
        await dummyErc20Contract.deployed();

    gatewayStakingContract = await gatewayStakingFactory.deploy(dummyErc20Contract.address, 'GatewayProtocolShares', 'GPS');
    await gatewayStakingContract.deployed();

    flagsStorage = await upgrades.deployProxy(flagsStorageFactory, [identityCom.address], { kind: 'uups' });
    await flagsStorage.deployed();

    chargeHandler = await upgrades.deployProxy(chargeHandlerFactory, [identityCom.address], { kind: 'uups' }) as ChargeHandler;
    gatewayNetwork = await gatewayNetworkFactory.connect(identityCom).deploy(gatekeeperContract.address, gatewayStakingContract.address);
    
    await chargeHandler.deployed();
    await gatewayNetwork.deployed();

    await gatekeeperContract.setNetworkContractAddress(gatewayNetwork.address);
    await chargeHandler.setNetworkContractAddress(gatewayNetwork.address);

    await gatewayNetwork.connect(identityCom).grantRole(await gatewayNetwork.NETWORK_FEE_PAYER_ROLE(), 0, chargeHandler.address, {gasLimit: 300000});

    const args = [
      'Gateway Protocol',
      'GWY',
      identityCom.address,
      flagsStorage.address,
      chargeHandler.address,
      [forwarder.address],
      gatewayNetwork.address,
      gatekeeperContract.address,
      gatewayStakingContract.address
    ];

    gatewayToken = await upgrades.deployProxy(gatewayTokenFactory, args, { kind: 'uups' });
    await gatewayToken.deployed();

    // set the gateway token contract as the owner of the chargeHandler
    const chargeHandlerContract = await ethers.getContractAt('ChargeHandler', chargeHandler.address);
    await chargeHandlerContract.setRole(keccak256(toUtf8Bytes('CHARGE_CALLER_ROLE')), gatewayToken.address);

    // Use the internal test contract to test internal functions
    gatewayTokenInternalsTest = await upgrades.deployProxy(gatewayTokenInternalsTestFactory, args, { kind: 'uups' });
    await gatewayTokenInternalsTest.deployed();

    // create gatekeeper networks
    const networkOne = getNetwork(identityCom.address, 'GKN-1');
    const networkTwo = getNetwork(identityCom.address, 'GKN-2');
    const networkThree = getNetwork(identityCom.address, 'GKN-3', dummyErc20Contract.address);

    await gatewayNetwork.connect(identityCom).createNetwork(networkOne);
    await gatewayNetwork.connect(identityCom).createNetwork(networkTwo);
    await gatewayNetwork.connect(identityCom).createNetwork(networkThree);

    await gatewayNetwork.connect(identityCom).addGatekeeper(gatekeeper.address.toString(), utils.formatBytes32String('GKN-1'));

    gkn1 = await gatewayNetwork.getNetworkId(utils.formatBytes32String('GKN-1'));
    gkn2 = await gatewayNetwork.getNetworkId(utils.formatBytes32String('GKN-2'));
    gkn3 = await gatewayNetwork.getNetworkId(utils.formatBytes32String('GKN-3'));
  });

  describe('Deployment Tests', async () => {
    describe('gatewayToken', async () => {
      it('emits an event on deployment', async () => {
        const gatewayTokenFactory = await ethers.getContractFactory('GatewayToken');

        const args = [
          'Gateway Protocol2',
          'GWY2',
          identityCom.address,
          flagsStorage.address,
          chargeHandler.address,
          [forwarder.address],
          gatewayNetwork.address,
          gatekeeperContract.address,
          gatewayStakingContract.address
        ];

        const contract = await upgrades.deployProxy(gatewayTokenFactory, args, { kind: 'uups' });

        // check the events emitted by deploying the contract
        // we use this method (parsing the logs) rather than the hardhat chai matcher `.to.emit()`
        // because upgrades.deployProxy does not return a transaction.
        const receipt = await contract.deployTransaction.wait();
        const parsedLogs = receipt.logs.map((log) => contract.interface.parseLog(log));
        expect(parsedLogs.map((l) => l.name)).to.include('GatewayTokenInitialized');
      });

      it('fails deployment with a NULL ADDRESS for the superAdmin', async () => {
        const gatewayTokenFactory = await ethers.getContractFactory('GatewayToken');

        const args = [
          'Gateway Protocol',
          'GWY',
          ZERO_ADDRESS,
          flagsStorage.address,
          chargeHandler.address,
          [forwarder.address],
          gatewayNetwork.address,
          gatekeeperContract.address,
          gatewayStakingContract.address
        ];
        await expect(upgrades.deployProxy(gatewayTokenFactory, args, { kind: 'uups' })).to.be.revertedWithCustomError(
          gatewayToken,
          'Common__MissingAccount',
        );
      });

      it('fails deployment with a NULL ADDRESS for the flagsStorage', async () => {
        const gatewayTokenFactory = await ethers.getContractFactory('GatewayToken');

        const args = [
          'Gateway Protocol',
          'GWY',
          identityCom.address,
          ZERO_ADDRESS,
          chargeHandler.address,
          [forwarder.address],
          gatewayNetwork.address,
          gatekeeperContract.address,
          gatewayStakingContract.address
        ];
        await expect(upgrades.deployProxy(gatewayTokenFactory, args, { kind: 'uups' })).to.be.revertedWithCustomError(
          gatewayToken,
          'Common__MissingAccount',
        );
      });

      it('fails deployment with a NULL ADDRESS for the chargeHandler', async () => {
        const gatewayTokenFactory = await ethers.getContractFactory('GatewayToken');

        const args = [
          'Gateway Protocol',
          'GWY',
          identityCom.address,
          flagsStorage.address,
          ZERO_ADDRESS,
          [forwarder.address],
          gatewayNetwork.address,
          gatekeeperContract.address,
          gatewayStakingContract.address
        ];
        await expect(upgrades.deployProxy(gatewayTokenFactory, args, { kind: 'uups' })).to.be.revertedWithCustomError(
          gatewayToken,
          'Common__MissingAccount',
        );
      });

      it('fails deployment with a NULL ADDRESS in the trusted forwarder array', async () => {
        const gatewayTokenFactory = await ethers.getContractFactory('GatewayToken');

        const args = [
          'Gateway Protocol',
          'GWY',
          identityCom.address,
          flagsStorage.address,
          chargeHandler.address,
          [forwarder.address, ZERO_ADDRESS],
          gatewayNetwork.address,
          gatekeeperContract.address,
          gatewayStakingContract.address
        ];
        await expect(upgrades.deployProxy(gatewayTokenFactory, args, { kind: 'uups' })).to.be.revertedWithCustomError(
          gatewayToken,
          'Common__MissingAccount',
        );
      });

      it('cannot call initialize after deployment', async () => {
        await expect(
          gatewayToken.initialize(
            'Gateway Protocol',
            'GWY',
            identityCom.address,
            flagsStorage.address,
            chargeHandler.address,
            [forwarder.address],
            gatewayNetwork.address,
            gatekeeperContract.address,
            gatewayStakingContract.address
          ),
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
          upgrades.deployProxy(flagsStorageFactory, [ZERO_ADDRESS], { kind: 'uups' }),
        ).to.be.revertedWithCustomError(flagsStorage, 'Common__MissingAccount');
      });
    });

    describe('chargeHandler', async () => {
      it('fails deployment with a NULL ADDRESS for the owner', async () => {
        const chargeHandlerFactory = await ethers.getContractFactory('ChargeHandler');
        await expect(
          upgrades.deployProxy(chargeHandlerFactory, [ZERO_ADDRESS], { kind: 'uups' }),
        ).to.be.revertedWithCustomError(chargeHandler, 'Common__MissingAccount');
      });
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

    it('Sets a new flag storage contract - reverts on zero address', async () => {
      const flagsStorageFactory = await ethers.getContractFactory('FlagsStorage');
      const flagsStorage2 = await upgrades.deployProxy(flagsStorageFactory, [identityCom.address], { kind: 'uups' });
      await flagsStorage2.deployed();

      await expect(gatewayToken.connect(identityCom).updateFlagsStorage(ZERO_ADDRESS)).to.be.revertedWithCustomError(
        gatewayToken,
        'Common__MissingAccount',
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
      await expect(flagsStorage.updateSuperAdmin(ZERO_ADDRESS)).to.be.revertedWithCustomError(
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

    it('a superadmin cannot revoke themselves', async () => {
      await expect(
        gatewayToken.connect(identityCom).revokeSuperAdmin(identityCom.address),
      ).to.be.revertedWithCustomError(gatewayToken, 'ParameterizedAccessControl__NoSelfAdminRemoval');
    });
  });



  describe('Test gateway token issuance', async () => {
    it('verified returns false if a token is not yet minted', async () => {
      return expectVerified(alice.address, gkn1).to.be.false;
    });

    it('mint Gateway Token for Alice by gatekeeper with gatekeeperNetwork = 1', async () => {
      await gatewayToken.connect(gatekeeper).mint(alice.address, gkn1, 0, 0, {
        recipient: gatekeeper.address,
        tokenSender: ZERO_ADDRESS,
      }); 

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
      await gatewayNetwork.connect(identityCom).addGatekeeper(gatekeeper.address.toString(), utils.formatBytes32String('GKN-2'));

      await gatewayToken.connect(gatekeeper).mint(alice.address, gkn2, 0, 0, {
        recipient: gatekeeper.address,
        tokenSender: ZERO_ADDRESS,
      });

      return expectVerified(alice.address, gkn2).to.be.true;
    });

    it('mint a second token for Alice with gatekeeperNetwork = 1', async () => {
      await gatewayToken.connect(gatekeeper).mint(alice.address, gkn1, 0, 0, {
        recipient: gatekeeper.address,
        tokenSender: ZERO_ADDRESS,
      });

      return expectVerified(alice.address, gkn2).to.be.true;
    });

    it('get all tokens for a user and network', async () => {
      const aliceTokenIdsGKN1 = await gatewayToken.getTokenIdsByOwnerAndNetwork(alice.address, gkn1, true);
      expect(aliceTokenIdsGKN1.length).to.equal(2);
      expect(await gatewayToken.ownerOf(aliceTokenIdsGKN1[0])).to.equal(alice.address);
      expect(await gatewayToken.ownerOf(aliceTokenIdsGKN1[1])).to.equal(alice.address);
    });

    it('onlyActive should determine whether an expired token is returned or not', async () => {
      const aliceTokenIdsGKN1 = await gatewayToken.getTokenIdsByOwnerAndNetwork(alice.address, gkn1, true);
      const beforeExpiration = await gatewayToken.getExpiration(aliceTokenIdsGKN1[1]);
      await gatewayToken
        .connect(gatekeeper)
        .setExpiration(aliceTokenIdsGKN1[1], Date.parse('2020-01-01') / 1000, {
          recipient: gatekeeper.address,
          tokenSender: ZERO_ADDRESS,
        });

      const aliceTokenIdsGKN1AfterExpiry = await gatewayToken.getTokenIdsByOwnerAndNetwork(alice.address, gkn1, true);

      expect(aliceTokenIdsGKN1AfterExpiry.length).to.equal(1);
      expect(await gatewayToken.ownerOf(aliceTokenIdsGKN1AfterExpiry[0])).to.equal(alice.address);

      const aliceTokenIdsGKN1AfterExpiryFlagFalse = await gatewayToken.getTokenIdsByOwnerAndNetwork(
        alice.address,
        gkn1,
        false,
      );
      expect(aliceTokenIdsGKN1AfterExpiryFlagFalse.length).to.equal(2);
      expect(await gatewayToken.ownerOf(aliceTokenIdsGKN1AfterExpiryFlagFalse[0])).to.equal(alice.address);
      expect(await gatewayToken.ownerOf(aliceTokenIdsGKN1AfterExpiryFlagFalse[1])).to.equal(alice.address);

      // reset expiration
      await gatewayToken.connect(gatekeeper).setExpiration(aliceTokenIdsGKN1[1], beforeExpiration, {
        recipient: gatekeeper.address,
        tokenSender: ZERO_ADDRESS,
      });
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
      await gatewayToken.connect(gatekeeper).mint(dummyWallet, gkn1, 0, expectedBitmask, {
        recipient: gatekeeper.address,
        tokenSender: ZERO_ADDRESS,
      });

      const [dummyWalletTokenId] = await gatewayToken.getTokenIdsByOwnerAndNetwork(dummyWallet, gkn1, true);
      const bitmask = await gatewayToken.getTokenBitmask(dummyWalletTokenId);

      expect(bitmask).to.equal(expectedBitmask);
    });

    it('Mint a token with an network expiration', async () => {
      const dummyWallet = randomAddress();

      const blockNum = await ethers.provider.getBlockNumber();
      const blockBefore = await ethers.provider.getBlock(blockNum);
      const timestampBefore = blockBefore.timestamp;

      const expectedExpiration = (await gatewayNetwork.connect(identityCom).getNetwork(gkn1)).passExpireDurationInSeconds.add(timestampBefore + 1);
      await gatewayToken.connect(gatekeeper).mint(dummyWallet, gkn1, 0, 0, {
        recipient: gatekeeper.address,
        tokenSender: ZERO_ADDRESS,
      });

      const [dummyWalletTokenId] = await gatewayToken.getTokenIdsByOwnerAndNetwork(dummyWallet, gkn1, true);
      const expiration = await gatewayToken.getExpiration(dummyWalletTokenId);

      expect(expiration).to.equal(expectedExpiration);
    });

    it('Mint a token with a gatekeeper expiration', async () => {
      // given
      const dummyWallet = randomAddress();
      const expectedExpiration = (Date.now() * 1000) + 100000;

      await gatewayNetwork.connect(identityCom).updatePassExpirationTime(0,utils.formatBytes32String('GKN-1'));
      
      // when
      await gatewayToken.connect(gatekeeper).mint(dummyWallet, gkn1, expectedExpiration, 0, {
        recipient: gatekeeper.address,
        tokenSender: ZERO_ADDRESS,
      });

      const [dummyWalletTokenId] = await gatewayToken.getTokenIdsByOwnerAndNetwork(dummyWallet, gkn1, true);
      const expiration = await gatewayToken.getExpiration(dummyWalletTokenId);

      // expect
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

    describe('with ERC2771 clients', () => {
      let erc2771Client: Contract;
      before('deploy client', async () => {
        const erc2771ClientFactory = await ethers.getContractFactory('GatewayTokenClientERC2771Test');
        erc2771Client = await erc2771ClientFactory.deploy(gatewayToken.address, gkn1);
      });

      it('rejects if the contract address is zero', async () => {
        const erc2771ClientFactory = await ethers.getContractFactory('GatewayTokenClientERC2771Test');

        await expect(erc2771ClientFactory.deploy(ZERO_ADDRESS, gkn1)).to.be.reverted;
      });

      it('supports ERC2771 clients', async () => {
        // Alice is verified
        await expect(erc2771Client.connect(alice).testGated()).to.emit(erc2771Client, 'Success');
      });

      it('supports ERC2771 clients (negative case)', async () => {
        // Carol is not verified
        await expect(erc2771Client.connect(carol).testGated()).to.be.revertedWithCustomError(
          client,
          'IsGated__InvalidGatewayToken',
        );
      });
    });

    describe('with upgradeable ERC2771 clients', () => {
      let erc2771Client: Contract;
      before('deploy client', async () => {
        const erc2771ClientFactory = await ethers.getContractFactory('GatewayTokenClientERC2771UpgradeableTest');
        erc2771Client = await upgrades.deployProxy(erc2771ClientFactory, [gatewayToken.address, gkn1, []], {
          kind: 'uups',
        });
        await erc2771Client.deployed();
      });

      it('rejects if the contract address is zero', async () => {
        const erc2771ClientFactory = await ethers.getContractFactory('GatewayTokenClientERC2771UpgradeableTest');

        await expect(
          upgrades.deployProxy(erc2771ClientFactory, [ZERO_ADDRESS, gkn1, []], {
            kind: 'uups',
          }),
        ).to.be.reverted;
      });

      it('supports Upgradeable ERC2771 clients', async () => {
        // Alice is verified
        await expect(erc2771Client.connect(alice).testGated()).to.emit(erc2771Client, 'Success');
      });

      it('supports Upgradeable ERC2771 clients (negative case)', async () => {
        // Carol is not verified
        await expect(erc2771Client.connect(carol).testGated()).to.be.revertedWithCustomError(
          client,
          'IsGated__InvalidGatewayToken',
        );
      });
      it('cannot call initialize after deployment', async () => {
        await expect(erc2771Client.initialize(gatewayToken.address, gkn1, [])).to.be.revertedWith(
          /Initializable: contract is already initialized/,
        );
      });
    });
  });

  describe('Test gateway token operations: freeze, unfreeze, setExpiration, revoke', async () => {
    let dummyWallet: string;
    let dummyWalletTokenId: number;

    beforeEach(async () => {
      dummyWallet = randomAddress();
      await gatewayToken.connect(gatekeeper).mint(dummyWallet, gkn1, 0, 0, {
        recipient: gatekeeper.address,
        tokenSender: ZERO_ADDRESS,
      });

      [dummyWalletTokenId] = await gatewayToken.getTokenIdsByOwnerAndNetwork(dummyWallet, gkn1, true);
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
      await gatewayToken.connect(gatekeeper).mint(dummyWallet, gkn1, 0, 0, {
        recipient: gatekeeper.address,
        tokenSender: ZERO_ADDRESS,
      });
      const dummyWalletTokenIds = await gatewayToken.getTokenIdsByOwnerAndNetwork(alice.address, gkn1, true);

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
        .setExpiration(dummyWalletTokenId, Date.parse('2020-01-01') / 1000, {
          recipient: gatekeeper.address,
          tokenSender: ZERO_ADDRESS,
        });

      const currentExpiration = await gatewayToken.getExpiration(dummyWalletTokenId);
      expect(currentExpiration).to.equal(Date.parse('2020-01-01') / 1000);

      return expectVerified(dummyWallet, gkn1).to.be.false;
    });

    it('extend expiry', async () => {
      await gatewayToken
        .connect(gatekeeper)
        .setExpiration(dummyWalletTokenId, Date.parse('2222-01-01') / 1000, {
          recipient: gatekeeper.address,
          tokenSender: ZERO_ADDRESS,
        });

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
      await gatewayToken.connect(gatekeeper).mint(dummyWallet, gkn1, 0, 0, {
        recipient: gatekeeper.address,
        tokenSender: ZERO_ADDRESS,
      });
      const dummyWalletTokenIds = await gatewayToken.getTokenIdsByOwnerAndNetwork(dummyWallet, gkn1, true);

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
      await gatewayToken.connect(gatekeeper).mint(dummyWallet, gkn1, 0, 0, {
        recipient: gatekeeper.address,
        tokenSender: ZERO_ADDRESS,
      });
      const dummyWalletTokenIds = await gatewayToken.getTokenIdsByOwnerAndNetwork(dummyWallet, gkn1, true);

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
      [tokenId] = await gatewayToken.getTokenIdsByOwnerAndNetwork(alice.address, gkn1, true);
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
      await expect(gatewayToken.connect(identityCom).addForwarder(newForwarder)).to.emit(
        gatewayToken,
        'ForwarderAdded',
      );

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

      await expect(gatewayToken.connect(identityCom).removeForwarder(newForwarder)).to.emit(
        gatewayToken,
        'ForwarderRemoved',
      );
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
        .populateTransaction.mint(carol.address, gkn1, 0, 0, {
          recipient: gatekeeper.address,
          tokenSender: ZERO_ADDRESS,
        });

      // Carol does not have the GT yet, because the tx has not been sent
      await expectVerified(carol.address, gkn1).to.be.false;

      const input = {
        from: gatekeeper.address,
        to: gatewayToken.address,
        data: mintTx.data as string,
        gas: 500_000,
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
        .populateTransaction.mint(randomAddress(), gkn1, 0, 0, {
          recipient: gatekeeper.address,
          tokenSender: ZERO_ADDRESS,
        });

      const input = {
        from: gatekeeper.address,
        to: gatewayToken.address,
        data: mintTx.data as string,
        gas: 500_000,
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
        .populateTransaction.mint(wallet.address, gkn1, 0, 0, {
          recipient: gatekeeper.address,
          tokenSender: ZERO_ADDRESS,
        });

      const input1 = {
        from: gatekeeper.address,
        to: gatewayToken.address,
        data: mintTx.data as string,
        gas: 500_000,
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
        gas: 500_000,
      };
      const { request: request2, signature: signature2 } = await signMetaTxRequest(
        alice,
        forwarder as IForwarder,
        input2,
      );

      // attempt to send the forwarded transaction
      await expect(forwarder.connect(alice).execute(request2, signature2, { gasLimit: 1000000 })).to.be.revertedWith(
        /ReentrancyGuard: reentrant call/,
      );

      await expectVerified(wallet.address, gkn1).to.be.false;
    });

    // The forwarder allows two transactions to be sent with the same nonce, as long as they are different
    // this is important for relayer support
    it('Forwards transactions out of sync', async () => {
      // create two transactions, that share the same forwarder nonce
      const tx1 = await gatewayToken
        .connect(gatekeeper)
        .populateTransaction.mint(randomAddress(), gkn1, 0, 0, {
          recipient: gatekeeper.address,
          tokenSender: ZERO_ADDRESS,
        });
      const tx2 = await gatewayToken
        .connect(gatekeeper)
        .populateTransaction.mint(randomAddress(), gkn1, 0, 0, {
          recipient: gatekeeper.address,
          tokenSender: ZERO_ADDRESS,
        });

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
      await gatewayToken.connect(gatekeeper).mint(userToBeFrozen.address, gkn1, 0, 0, {
        recipient: gatekeeper.address,
        tokenSender: ZERO_ADDRESS,
      });
      const [tokenId] = await gatewayToken.getTokenIdsByOwnerAndNetwork(userToBeFrozen.address, gkn1, true);
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

    it('Rejects old transactions', async () => {
      const forwarderFactory = await ethers.getContractFactory('FlexibleNonceForwarder');
      // this forwarder only accepts transactions whose nonces have been seen in this block
      const intolerantForwarder = await forwarderFactory.deploy(0);
      await intolerantForwarder.deployed();

      await gatewayToken.addForwarder(intolerantForwarder.address);

      // create two transactions,
      const tx1 = await gatewayToken
        .connect(gatekeeper)
        .populateTransaction.mint(randomAddress(), gkn1, 0, 0, {
          recipient: gatekeeper.address,
          tokenSender: ZERO_ADDRESS,
        });
      const tx2 = await gatewayToken
        .connect(gatekeeper)
        .populateTransaction.mint(randomAddress(), gkn1, 0, 0, {
          recipient: gatekeeper.address,
          tokenSender: ZERO_ADDRESS,
        });
      const req1 = await signMetaTxRequest(gatekeeper, intolerantForwarder as IForwarder, {
        from: gatekeeper.address,
        to: gatewayToken.address,
        data: tx1.data as string,
        gas: 500_000,
      });
      const req2 = await signMetaTxRequest(gatekeeper, intolerantForwarder as IForwarder, {
        from: gatekeeper.address,
        to: gatewayToken.address,
        data: tx2.data as string,
        gas: 500_000,
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
        .populateTransaction.mint(randomAddress(), gkn1, 0, 0, {
          recipient: gatekeeper.address,
          tokenSender: ZERO_ADDRESS,
        });
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

    it('exposes the correct message data when forwarding a transaction', async () => {
      await expect(gatewayTokenInternalsTest.getMsgData(1)).to.emit(gatewayTokenInternalsTest, 'MsgData');

      const txIndirect = await gatewayTokenInternalsTest.connect(gatekeeper).populateTransaction.getMsgData(1);

      const req = await signMetaTxRequest(gatekeeper, forwarder as IForwarder, {
        from: gatekeeper.address,
        // specify the internals test contract here instead of gatewayToken
        to: gatewayTokenInternalsTest.address,
        data: txIndirect.data as string,
        gas: 500_000,
      });
      await expect(forwarder.connect(alice).execute(req.request, req.signature)).to.emit(
        gatewayTokenInternalsTest,
        'MsgData',
      );
    });

    it('Exposes the correct message sender when forwarding a transaction (upgradeable version)', async () => {
      await expect(gatewayTokenInternalsTest.connect(gatekeeper).getMsgSender())
        .to.emit(gatewayTokenInternalsTest, 'MsgSender')
        .withArgs(gatekeeper.address);

      const txIndirect = await gatewayTokenInternalsTest.connect(gatekeeper).populateTransaction.getMsgSender();

      const req = await signMetaTxRequest(gatekeeper, forwarder as IForwarder, {
        from: gatekeeper.address,
        // specify the internals test contract here instead of gatewayToken
        to: gatewayTokenInternalsTest.address,
        data: txIndirect.data as string,
        gas: 500_000,
      });
      await expect(forwarder.connect(alice).execute(req.request, req.signature))
        .to.emit(gatewayTokenInternalsTest, 'MsgSender')
        .withArgs(gatekeeper.address);
    });

    // forwarding reserves 1/64rd of the gas for the forwarder to use. If the gas limit is less than that,
    // it reverts.
    it('reverts if the gas limit is less than 1/64rd more than the target transaction', async () => {
      // create two transactions, that share the same forwarder nonce
      const tx1 = await gatewayToken
        .connect(gatekeeper)
        .populateTransaction.mint(randomAddress(), gkn1, 0, 0, {
          recipient: gatekeeper.address,
          tokenSender: ZERO_ADDRESS,
        });
      const req1 = await makeMetaTx(tx1);
      // we pass 2,000,000 gas limit to the inner tx (see makeMetaTx)
      // The forwarder reserves 1/64th of that
      const gas = req1.request.gas;
      const reservedGas = Math.ceil(BigNumber.from(gas).toNumber() / 64);

      // 280000 is what is reported by the evm as needed by the mint tx.
      // if we add `reservedGas` to that, and set that as the gas limit, it should work
      // otherwise it will revert
      // expect to have to change this if any of the parameters of the tx change, or if the contract chagnes
      const requiredGas = 280000;
      const gasLimit = requiredGas + reservedGas; // - 10; // less than the required
      await expect(forwarder.connect(alice).execute(req1.request, req1.signature, { gasLimit })).to.be.reverted;
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
        gas: 500_000,
      });
      await expect(forwarder.connect(alice).execute(req.request, req.signature)).to.emit(
        gatewayTokenInternalsTest,
        'AuthorizedUpgrade',
      );
    });

    describe('using MultiERC2771Context (non-upgradeable version)', () => {
      let erc2771Test: Contract;

      // the msgData includes the function code (getMsgData) followed by the packed arguments
      // we have only one argument, and it's a uint8. So we just check that that is equal to 1.
      const matchesExpectedMsgData =
        (expectedValue: number) =>
        (eventArg: any): boolean => {
          const bytes = Array.from(Buffer.from(eventArg.replace('0x', ''), 'hex'));
          const lastByte = bytes[bytes.length - 1];
          return lastByte === expectedValue;
        };

      // msgData, when a function is called without any arguments,
      // should be 4 bytes long (the function name hash only)
      const hasFourBytes = (msgData: string) => {
        const bytes = Array.from(Buffer.from(msgData.replace('0x', ''), 'hex'));
        return bytes.length === 4;
      };

      before('set up erc2771 test contract', async () => {
        const ERC2771TestFactory = await ethers.getContractFactory('ERC2771Test');
        erc2771Test = await ERC2771TestFactory.deploy([forwarder.address]);
      });

      it('remove a forwarder', async () => {
        const newForwarder = randomAddress();
        await erc2771Test.connect(identityCom).addForwarder(newForwarder);
        expect(await erc2771Test.isTrustedForwarder(newForwarder)).to.equal(true);

        await erc2771Test.connect(identityCom).removeForwarder(newForwarder);
        expect(await erc2771Test.isTrustedForwarder(newForwarder)).to.equal(false);
      });

      it('Exposes the correct message sender', async () => {
        const txIndirect = await erc2771Test.connect(gatekeeper).populateTransaction.getMsgSender();

        const req = await signMetaTxRequest(gatekeeper, forwarder as IForwarder, {
          from: gatekeeper.address,
          to: erc2771Test.address,
          data: txIndirect.data as string,
          gas: 500_000,
        });
        await expect(forwarder.connect(alice).execute(req.request, req.signature))
          .to.emit(erc2771Test, 'MsgSender')
          .withArgs(gatekeeper.address);
      });

      it('Exposes the correct message data', async () => {
        const txIndirect = await erc2771Test.connect(gatekeeper).populateTransaction.getMsgDataWithArg(1);

        const req = await signMetaTxRequest(gatekeeper, forwarder as IForwarder, {
          from: gatekeeper.address,
          to: erc2771Test.address,
          data: txIndirect.data as string,
          gas: 500_000,
        });
        // the msgData includes the function code (getMsgData) followed by the packed arguments
        // we have only one argument, and it's a uint8. So we just check that that is equal to 1.
        await expect(forwarder.connect(alice).execute(req.request, req.signature))
          .to.emit(erc2771Test, 'MsgData')
          .withArgs(matchesExpectedMsgData(1));
      });

      // weird edge case but this is supported - required for ERC2771-compliance
      it('MultiERC2771Context works if the trusted forwarder is not an ERC2771 contract (as long as msg.data is small)', async () => {
        // Deploy an instance of ERC2771 - this is a direct contract (no proxy).
        // Add the gatekeeper as a trusted forwarder (weird because it isn't one).
        // send a message with a small msg.data (no parameters and not a proxy).
        // the msg.sender should be the gatekeeper.
        // This works because we check the size of the msg.data as well as the trusted forwarder
        // if the msg.data is >20, this would return garbage, as it can't tell the difference between
        // a message from an ERC2771 forwarder and a normal message.
        const ERC2771TestFactory = await ethers.getContractFactory('ERC2771Test');
        const erc2771Test = await ERC2771TestFactory.deploy([]);

        // add the gatekeeper as a trusted forwarder
        await erc2771Test.connect(identityCom).addForwarder(gatekeeper.address);

        // calls via the gatekeeper still return the correct sender and data even though
        // the gatekeeper is a trusted forwarder and expected therefore to send the original
        // message sender as part of the call data
        await expect(erc2771Test.connect(gatekeeper).getMsgSender())
          .to.emit(erc2771Test, 'MsgSender')
          .withArgs(gatekeeper.address);

        // If we call a function with no arguments, the resultant msgData will just be the function hash
        // (MultiERC2771Context will pass it through and will not try to strip the last 20 bytes)
        // If the function has *any arguments* then MultiERC2771Context cannot tell the difference
        // between a forwarded function and one called directly from the trusted forwarder
        // and will therefore assume it is forwarded because it is coming from a trusted forwarder.
        await expect(erc2771Test.connect(gatekeeper).getMsgData())
          .to.emit(erc2771Test, 'MsgData')
          .withArgs(hasFourBytes);
      });
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

  describe('Charge', () => {
    const forward = async (
      tx: PopulatedTransaction,
      from: SignerWithAddress,
      value?: BigNumber,
    ): Promise<TransactionReceipt> => {
      const input = {
        from: gatekeeper.address,
        to: gatewayToken.address,
        data: tx.data as string,
        gas: 500_000,
        ...(value ? { value } : {}),
      };
      const { request, signature } = await signMetaTxRequest(gatekeeper, forwarder as IForwarder, input);

      // send the forwarded transaction
      const forwarderTx = await forwarder.connect(from).execute(request, signature, { gasLimit: 1000000, value });
      const receipt = await forwarderTx.wait();
      expect(receipt.status).to.equal(1);

      return receipt;
    };


    it('cannot add some other contract as a charge caller if not an admin', async () => {
      // A charge caller is a contract that is permitted to ask the charge handler to charge a user
      await expect(
        chargeHandler.connect(alice).setRole(keccak256(toUtf8Bytes('CHARGE_CALLER_ROLE')), alice.address),
      ).to.be.to.be.revertedWith(/AccessControl/);
    });

    it('cannot call initialize on ChargeHandler after deployment', async () => {
      await expect(chargeHandler.initialize(alice.address)).to.be.revertedWith(
        /Initializable: contract is already initialized/,
      );
    });

    afterEach('charge clean up', async () => {
      await gatewayStakingContract.connect(identityCom).setMinimumGatekeeperStake(0);
      const gatekeeperShares = await gatewayStakingContract.balanceOf(gatekeeper.address);

      if(gatekeeperShares.gt(0)) {
        await gatewayStakingContract.connect(gatekeeper).withdrawStake(gatekeeperShares);
      }
    })

    context('ETH', () => {

      beforeEach('reset gatekeepers', async () => {
  
        // re-create gatekeeper network
        const networkOne = getNetwork(identityCom.address, 'GKN-1');
  
  
        const networkOneFeeBalance = await gatewayNetwork.networkFeeBalances(networkOne.name);
  
        // withdraw fees from networks
        if(networkOneFeeBalance.gt(0)) { await gatewayNetwork.connect(identityCom).withdrawNetworkFees(networkOne.name, {gasLimit: 300000 })}

  
        // remove networks gatekeeper and close networks
        await gatewayNetwork.connect(identityCom).removeGatekeeper(gatekeeper.address, networkOne.name);
  
        await gatewayNetwork.connect(identityCom).closeNetwork(networkOne.name);
    
        // recreate networks so fees can be updated in each test
        await gatewayNetwork.connect(identityCom).createNetwork(networkOne);
    
        await gatewayNetwork.connect(identityCom).addGatekeeper(gatekeeper.address.toString(), utils.formatBytes32String('GKN-1'));
      });

      it('can charge ETH through a forwarded call', async () => {
        const charge = makeWeiCharge(ethers.utils.parseEther('0.1'));
        const balanceBefore = await alice.getBalance();
        const gatekeeperBalanceBefore = await gatekeeper.getBalance();

        const FEES: IGatewayGatekeeper.GatekeeperFeesStruct = {
          issueFee: charge.value,
          refreshFee: charge.value,
          expireFee: charge.value,
          verificationFee: charge.value
        }

        await gatekeeperContract.connect(gatekeeper).updateFees(FEES, utils.formatBytes32String('GKN-1'), { gasLimit: 1000000 });
        // create a mint transaction
        const tx = await gatewayToken.connect(gatekeeper).populateTransaction.mint(alice.address, gkn1, 0, 0, charge.partiesInCharge);

        // forward it so that Alice sends it, and includes a value
        const receipt = await forward(tx, alice, charge.value);

        // check that Alice's balance has gone down by the charge amount + gas
        const balanceAfter = await alice.getBalance();
        const gatekeeperBalanceAfter = await gatekeeper.getBalance();
        
        const gas = receipt.gasUsed.mul(receipt.effectiveGasPrice);
        expect(balanceAfter).to.equal(balanceBefore.sub(charge.value).sub(gas));
        expect(gatekeeperBalanceAfter).to.greaterThan(gatekeeperBalanceBefore);
      });

      it('can charge ETH through a forwarded call with a gatekeeper that meets minimum stake requirement', async () => {
        const charge = makeWeiCharge(ethers.utils.parseEther('0.1'));
        const balanceBefore = await alice.getBalance();
        const gatekeeperBalanceBefore = await gatekeeper.getBalance();
        
        const MINIMUM_STAKE = 5000;

        // require a minimum amount of stake for gatekeepers
        await gatewayStakingContract.connect(identityCom).setMinimumGatekeeperStake(MINIMUM_STAKE);

        // gatekeeper deposit stake
        await giveDummyToken(gatekeeper, MINIMUM_STAKE * 2);
        await dummyErc20Contract.connect(gatekeeper).increaseAllowance(gatewayStakingContract.address, MINIMUM_STAKE);
        await gatewayStakingContract.connect(gatekeeper).depositStake(MINIMUM_STAKE, {gasLimit: 300000});

        const sharesBalance = await gatewayStakingContract.balanceOf(gatekeeper.address);

        expect(sharesBalance).to.be.eq(MINIMUM_STAKE);

        // update gatekeeper fees
        const FEES: IGatewayGatekeeper.GatekeeperFeesStruct = {
          issueFee: charge.value,
          refreshFee: charge.value,
          expireFee: charge.value,
          verificationFee: charge.value
        }

        await gatekeeperContract.connect(gatekeeper).updateFees(FEES, utils.formatBytes32String('GKN-1'));

        // create a mint transaction
        const tx = await gatewayToken.connect(gatekeeper).populateTransaction.mint(alice.address, gkn1, 0, 0, charge.partiesInCharge);

        // forward it so that Alice sends it, and includes a value
        const receipt = await forward(tx, alice, charge.value);

        // check that Alice's balance has gone down by the charge amount + gas
        const balanceAfter = await alice.getBalance();
        const gatekeeperBalanceAfter = await gatekeeper.getBalance();
        
        const gas = receipt.gasUsed.mul(receipt.effectiveGasPrice);
        expect(balanceAfter).to.equal(balanceBefore.sub(charge.value).sub(gas));
        expect(gatekeeperBalanceAfter).to.greaterThan(gatekeeperBalanceBefore);
      });

      it('can charge ETH through a forwarded call with a network fee', async () => {
        const charge = makeWeiCharge(ethers.utils.parseEther('0.1'));
        const balanceBefore = await alice.getBalance();
        const gatekeeperBalanceBefore = await gatekeeper.getBalance();
        const networkBalanceBefore = await ethers.provider.getBalance(gatewayNetwork.address);

        const GATEKEEPER_FEES: IGatewayGatekeeper.GatekeeperFeesStruct = {
          issueFee: charge.value,
          refreshFee: charge.value,
          expireFee: charge.value,
          verificationFee: charge.value
        }

        const NETWORK_FEES_IN_BPS: IGatewayNetwork.NetworkFeesBpsStruct = {
          issueFee: 1000, // 10% fee [(100 bps) / 10_000]
          refreshFee: 1000, // 10% fee [(100 bps) / 10_000]
          expireFee: 1000, // 10% fee [(100 bps) / 10_000]
          verificationFee: 1000, // 10% fee [(100 bps) / 10_000]
        }

        // Fast forward blocks so that fees can be updated again
        const networkFeeConfigDelayInSeconds = await gatewayNetwork.FEE_CONFIG_DELAY_TIME();
        await time.increase(networkFeeConfigDelayInSeconds.toNumber());

        await gatekeeperContract.connect(gatekeeper).updateFees(GATEKEEPER_FEES, utils.formatBytes32String('GKN-1'), { gasLimit: 1000000 });
        await gatewayNetwork.connect(identityCom).updateFees(NETWORK_FEES_IN_BPS, utils.formatBytes32String('GKN-1'), { gasLimit: 1000000 });

        // create a mint transaction
        const tx = await gatewayToken.connect(gatekeeper).populateTransaction.mint(alice.address, gkn1, 0, 0, charge.partiesInCharge);

        // forward it so that Alice sends it, and includes a value
        const receipt = await forward(tx, alice, charge.value);

        // check that Alice's balance has gone down by the charge amount + gas
        const balanceAfter = await alice.getBalance();
        const gatekeeperBalanceAfter = await gatekeeper.getBalance();
        const networkBalanceAfter = await ethers.provider.getBalance(gatewayNetwork.address);
        
        const gas = receipt.gasUsed.mul(receipt.effectiveGasPrice);

        const gatekeeperFeePercentage = BigNumber.from(10000).sub(NETWORK_FEES_IN_BPS.issueFee as BigNumber); // 100% - 10%
        const gatekeeperFeeValue = charge.value.mul(gatekeeperFeePercentage).div(10000).sub(gas);

        const networkFeeValue = charge.value.mul(NETWORK_FEES_IN_BPS.issueFee as BigNumber).div(10000);
        
        expect(balanceAfter).to.equal(balanceBefore.sub(charge.value).sub(gas));
        expect(gatekeeperBalanceAfter.sub(gatekeeperBalanceBefore)).to.greaterThan(gatekeeperFeeValue);
        expect(networkBalanceAfter.sub(networkBalanceBefore)).to.eq(networkFeeValue);

      });

      it('can charge ETH - revert if gatekeeper does not meet minimum stake requirement', async () => {
        const charge = makeWeiCharge(ethers.utils.parseEther('0.1'));

        
        const MINIMUM_STAKE = 5000;

        // require a minimum amount of stake for gatekeepers
        await gatewayStakingContract.connect(identityCom).setMinimumGatekeeperStake(MINIMUM_STAKE);


        // update gatekeeper fees
        const FEES: IGatewayGatekeeper.GatekeeperFeesStruct = {
          issueFee: charge.value,
          refreshFee: charge.value,
          expireFee: charge.value,
          verificationFee: charge.value
        }

        await gatekeeperContract.connect(gatekeeper).updateFees(FEES, utils.formatBytes32String('GKN-1'));

        // create a mint transaction
        const tx = await gatewayToken.connect(gatekeeper).populateTransaction.mint(alice.address, gkn1, 0, 0, charge.partiesInCharge);

        // forward it so that Alice sends it, and includes a value
        await expect(forward(tx, alice, charge.value)).to.be.revertedWithCustomError(gatewayToken, "GatewayToken__GatekeeperDoesNotMeetStakingRequirements");
      });

      it('charge ETH - revert if the recipient rejects it', async () => {
        const brokenRecipientFactory = await ethers.getContractFactory('DummyBrokenEthRecipient');
        const brokenRecipient = await brokenRecipientFactory.deploy();
        await brokenRecipient.deployed();

        const charge = makeWeiCharge(ethers.utils.parseEther('0.1'));
        charge.partiesInCharge.recipient = brokenRecipient.address;

        const FEES: IGatewayGatekeeper.GatekeeperFeesStruct = {
          issueFee: charge.value,
          refreshFee: charge.value,
          expireFee: charge.value,
          verificationFee: charge.value
        }

        await gatekeeperContract.connect(gatekeeper).updateFees(FEES, utils.formatBytes32String('GKN-1'), { gasLimit: 1000000 });

        // create a mint transaction
        const tx = await gatewayToken.connect(gatekeeper).populateTransaction.mint(alice.address, gkn1, 0, 0, charge.partiesInCharge);

        // forward it so that Alice sends it, and includes a value
        // this should fail, because the recipient rejects it
        await expect(forward(tx, alice, charge.value)).to.be.revertedWithCustomError(
          chargeHandler,
          'Charge__TransferFailed',
        );
      });

      it('can charge ETH - revert if amount sent is lower than the charge', async () => {
        const charge = makeWeiCharge(ethers.utils.parseEther('0.1'));

        const FEES: IGatewayGatekeeper.GatekeeperFeesStruct = {
          issueFee: charge.value,
          refreshFee: charge.value,
          expireFee: charge.value,
          verificationFee: charge.value
        }

        await gatekeeperContract.connect(gatekeeper).updateFees(FEES, utils.formatBytes32String('GKN-1'), { gasLimit: 1000000 });
        // create a mint transaction
        const tx = await gatewayToken.connect(gatekeeper).populateTransaction.mint(alice.address, gkn1, 0, 0, charge.partiesInCharge);

        // forward it so that Alice sends it. Alice tries to include a lower value than the charge
        await expect(forward(tx, alice, ethers.utils.parseEther('0.05'))).to.be.revertedWithCustomError(
          chargeHandler,
          'Charge__IncorrectValue',
        );
      });

      it('can charge ETH - revert if amount sent is higher than the charge', async () => {
        const charge = makeWeiCharge(ethers.utils.parseEther('0.1'));

        const FEES: IGatewayGatekeeper.GatekeeperFeesStruct = {
          issueFee: charge.value,
          refreshFee: charge.value,
          expireFee: charge.value,
          verificationFee: charge.value
        }

        await gatekeeperContract.connect(gatekeeper).updateFees(FEES, utils.formatBytes32String('GKN-1'), { gasLimit: 1000000 });

        // create a mint transaction
        const tx = await gatewayToken.connect(gatekeeper).populateTransaction.mint(alice.address, gkn1, 0, 0, charge.partiesInCharge);

        // forward it so that Alice sends it. Alice tries to include a higher value than the charge
        await expect(forward(tx, alice, ethers.utils.parseEther('0.15'))).to.be.revertedWithCustomError(
          chargeHandler,
          'Charge__IncorrectValue',
        );
      });

      it('can charge ETH - revert if no amount sent', async () => {
        const charge = makeWeiCharge(ethers.utils.parseEther('0.1'));

        const FEES: IGatewayGatekeeper.GatekeeperFeesStruct = {
          issueFee: charge.value,
          refreshFee: charge.value,
          expireFee: charge.value,
          verificationFee: charge.value
        }

        await gatekeeperContract.connect(gatekeeper).updateFees(FEES, utils.formatBytes32String('GKN-1'), { gasLimit: 1000000 });
        // create a mint transaction
        const tx = await gatewayToken.connect(gatekeeper).populateTransaction.mint(alice.address, gkn1, 0, 0, charge.partiesInCharge);

        // forward it so that Alice sends it. Alice tries to send it without a value
        await expect(forward(tx, alice)).to.be.revertedWithCustomError(chargeHandler, 'Charge__IncorrectValue');
      });

      it('can charge ETH - revert if charge is too high', async () => {
        const balance = await alice.getBalance();
        const charge = makeWeiCharge(balance.mul(2));

        const FEES: IGatewayGatekeeper.GatekeeperFeesStruct = {
          issueFee: charge.value,
          refreshFee: charge.value,
          expireFee: charge.value,
          verificationFee: charge.value
        }

        await gatekeeperContract.connect(gatekeeper).updateFees(FEES, utils.formatBytes32String('GKN-1'), { gasLimit: 1000000 });

        const shouldFail = gatewayToken.connect(alice).mint(alice.address, gkn1, 0, 0, charge.partiesInCharge, { value: charge.value });
        await expect(shouldFail).to.be.rejectedWith(/sender doesn't have enough funds/);
      });
    });

    context('ERC20', () => {
      let erc20: Contract;

      before('deploy ERC20 token', async () => {
        erc20 = dummyErc20Contract;
        await erc20.deployed();

        await gatewayNetwork.connect(identityCom).addGatekeeper(gatekeeper.address.toString(), utils.formatBytes32String('GKN-3'));
      });

      beforeEach('reset gatekeepers', async () => {
  
        // re-create gatekeeper network
        const networkThree = getNetwork(identityCom.address, 'GKN-3', dummyErc20Contract.address);
  
        const networkThreeFeeBalance = await gatewayNetwork.networkFeeBalances(networkThree.name);
  
        // withdraw fees from networks if still present
        if(networkThreeFeeBalance.gt(0)) { await gatewayNetwork.connect(identityCom).withdrawNetworkFees(networkThree.name, {gasLimit: 300000 })}
  
        // remove networks gatekeeper and close network

        const isGatekeeper = await gatewayNetwork.connect(identityCom).isGateKeeper(networkThree.name, gatekeeper.address);

        if(isGatekeeper) {
          await gatewayNetwork.connect(identityCom).removeGatekeeper(gatekeeper.address, networkThree.name);
        }

        await gatewayNetwork.connect(identityCom).closeNetwork(networkThree.name);
    
        // recreate networks so fees can be updated in each test
        await gatewayNetwork.connect(identityCom).createNetwork(networkThree);
    
        await gatewayNetwork.connect(identityCom).addGatekeeper(gatekeeper.address.toString(), networkThree.name);
      });

      it('can charge ERC20 - rejects if the ERC20 allowance was not made', async () => {
        const charge = makeERC20Charge(BigNumber.from('100'), erc20.address, alice.address);

        const FEES: IGatewayGatekeeper.GatekeeperFeesStruct = {
          issueFee: charge.value,
          refreshFee: charge.value,
          expireFee: charge.value,
          verificationFee: charge.value
        }

        await gatekeeperContract.connect(gatekeeper).updateFees(FEES, utils.formatBytes32String('GKN-3'), { gasLimit: 1000000 });

        // create a mint transaction
        const tx = await gatewayToken.connect(gatekeeper).populateTransaction.mint(alice.address, gkn3, 0, 0, charge.partiesInCharge);

        await expect(forward(tx, alice)).to.be.revertedWithCustomError(chargeHandler, 'Charge__IncorrectAllowance');
      });

      it('can charge ERC20 - reject if no internal allowance has been made', async () => {
        const charge = makeERC20Charge(BigNumber.from('100'), erc20.address, alice.address);

        // Alice allows the gateway token contract to transfer 100 to the gatekeeper
        await erc20.connect(alice).approve(chargeHandler.address, charge.value);

        const FEES: IGatewayGatekeeper.GatekeeperFeesStruct = {
          issueFee: charge.value,
          refreshFee: charge.value,
          expireFee: charge.value,
          verificationFee: charge.value
        }


        await gatekeeperContract.connect(gatekeeper).updateFees(FEES, utils.formatBytes32String('GKN-3'), { gasLimit: 1000000 });

        // create a mint transaction
        const tx = await gatewayToken.connect(gatekeeper).populateTransaction.mint(alice.address, gkn3, 0, 0, charge.partiesInCharge);

        await expect(forward(tx, alice)).to.be.revertedWithCustomError(chargeHandler, 'Charge__IncorrectAllowance');
      });

      it('can charge ERC20 - reject if the ERC20 allowance is insufficient', async () => {
        const charge = makeERC20Charge(BigNumber.from('100'), erc20.address, alice.address);

        // Alice allows the gateway token contract to transfer 90 to the gatekeeper
        await erc20.connect(alice).approve(chargeHandler.address, charge.value.sub(10));

        // Alice allows the gateway token contract to transfer 100 in the context of the gatekeeper network
        await chargeHandler.connect(alice).setApproval(gatewayToken.address, erc20.address, charge.value, gkn3);

        const FEES: IGatewayGatekeeper.GatekeeperFeesStruct = {
          issueFee: charge.value,
          refreshFee: charge.value,
          expireFee: charge.value,
          verificationFee: charge.value
        }

        await gatekeeperContract.connect(gatekeeper).updateFees(FEES, utils.formatBytes32String('GKN-3'), { gasLimit: 1000000 });

        // create a mint transaction
        const tx = await gatewayToken.connect(gatekeeper).populateTransaction.mint(alice.address, gkn3, 0, 0, charge.partiesInCharge);

        await expect(forward(tx, alice)).to.be.revertedWith('ERC20: insufficient allowance');
      });

      it('can charge ERC20 - reject if the internal allowance is insufficient', async () => {
        const charge = makeERC20Charge(BigNumber.from('100'), erc20.address, alice.address);

        // Alice allows the gateway token contract to transfer 100 to the gatekeeper
        await erc20.connect(alice).approve(chargeHandler.address, charge.value);


        // Alice allows the gateway token contract to transfer 90 in the context of the gatekeeper network
        await chargeHandler.connect(alice).setApproval(gatewayToken.address, erc20.address, charge.value.sub(10), gkn3);

        const FEES: IGatewayGatekeeper.GatekeeperFeesStruct = {
          issueFee: charge.value,
          refreshFee: charge.value,
          expireFee: charge.value,
          verificationFee: charge.value
        }

        await gatekeeperContract.connect(gatekeeper).updateFees(FEES, utils.formatBytes32String('GKN-3'), { gasLimit: 1000000 });

        // create a mint transaction
        const tx = await gatewayToken.connect(gatekeeper).populateTransaction.mint(alice.address, gkn3, 0, 0, charge.partiesInCharge);

        await expect(forward(tx, alice)).to.be.revertedWithCustomError(chargeHandler, 'Charge__IncorrectAllowance');
      });

      it('can charge ERC20 - reject if the internal allowance is for a different token', async () => {
        const charge = makeERC20Charge(BigNumber.from('100'), erc20.address, alice.address);

        // Alice allows the gateway token contract to transfer 100 to the gatekeeper
        await erc20.connect(alice).approve(chargeHandler.address, charge.value);

        // Alice allows the gateway token contract to transfer 100 of some other token in the context of the gatekeeper network
        const someOtherTokenAddress = randomAddress();
        await chargeHandler.connect(alice).setApproval(gatewayToken.address, someOtherTokenAddress, charge.value, gkn1);

        const FEES: IGatewayGatekeeper.GatekeeperFeesStruct = {
          issueFee: charge.value,
          refreshFee: charge.value,
          expireFee: charge.value,
          verificationFee: charge.value
        }

        await gatekeeperContract.connect(gatekeeper).updateFees(FEES, utils.formatBytes32String('GKN-3'), { gasLimit: 1000000 });

        // create a mint transaction
        const tx = await gatewayToken.connect(gatekeeper).populateTransaction.mint(alice.address, gkn3, 0, 0, charge.partiesInCharge);

        await expect(forward(tx, alice)).to.be.revertedWithCustomError(chargeHandler, 'Charge__IncorrectAllowance');
      });

      it('can charge ERC20 - reject if ETH is sent with the transaction', async () => {
        const charge = makeERC20Charge(BigNumber.from('100'), erc20.address, alice.address);

        // Alice allows the gateway token contract to transfer 90 to the gatekeeper
        await erc20.connect(alice).approve(chargeHandler.address, charge.value);

        // Alice allows the gateway token contract to transfer 100 in the context of the gatekeeper network
        await chargeHandler.connect(alice).setApproval(gatewayToken.address, erc20.address, charge.value, gkn3);

        const FEES: IGatewayGatekeeper.GatekeeperFeesStruct = {
          issueFee: charge.value,
          refreshFee: charge.value,
          expireFee: charge.value,
          verificationFee: charge.value
        }

        await gatekeeperContract.connect(gatekeeper).updateFees(FEES, utils.formatBytes32String('GKN-3'), { gasLimit: 1000000 });

        // create a mint transaction
        const tx = await gatewayToken.connect(gatekeeper).populateTransaction.mint(alice.address, gkn3, 0, 0, charge.partiesInCharge);

        await expect(forward(tx, alice, ethers.utils.parseEther('0.15'))).to.be.revertedWithCustomError(
          chargeHandler,
          'Charge__IncorrectValue',
        );
      });

      it('can charge ERC20 - reject if gatekeeper does not meet minimum stake requirements', async () => {
        const charge = makeERC20Charge(BigNumber.from('100'), erc20.address, alice.address);

        await dummyErc20Contract.connect(identityCom).transfer(alice.address, BigNumber.from('100'));

        const balanceBefore = await erc20.balanceOf(alice.address);
        // Alice allows the gateway token contract to transfer 100 to the gatekeeper
        await erc20.connect(alice).approve(chargeHandler.address, charge.value);

        // Alice allows the gateway token contract to transfer 100 in the context of the gatekeeper network
        await chargeHandler.connect(alice).setApproval(gatewayToken.address, erc20.address, charge.value, gkn3);

        const MINIMUM_STAKE = 5000;

        // require a minimum amount of stake for gatekeepers
        await gatewayStakingContract.connect(identityCom).setMinimumGatekeeperStake(MINIMUM_STAKE);


        const FEES: IGatewayGatekeeper.GatekeeperFeesStruct = {
          issueFee: charge.value,
          refreshFee: charge.value,
          expireFee: charge.value,
          verificationFee: charge.value
        }

        await gatekeeperContract.connect(gatekeeper).updateFees(FEES, utils.formatBytes32String('GKN-3'));

        // create a mint transaction
        const tx = await gatewayToken.connect(gatekeeper).populateTransaction.mint(alice.address, gkn3, 0, 0, charge.partiesInCharge);

        // forward it so that Alice sends it
        await expect(forward(tx, alice)).to.be.revertedWithCustomError(gatewayToken, "GatewayToken__GatekeeperDoesNotMeetStakingRequirements");
      });

      it('can charge ERC20 through a forwarded call', async () => {
        const charge = makeERC20Charge(BigNumber.from('100'), erc20.address, alice.address);

        await dummyErc20Contract.connect(identityCom).transfer(alice.address, BigNumber.from('100'));

        const balanceBefore = await erc20.balanceOf(alice.address);
        // Alice allows the gateway token contract to transfer 100 to the gatekeeper
        await erc20.connect(alice).approve(chargeHandler.address, charge.value);

        // Alice allows the gateway token contract to transfer 100 in the context of the gatekeeper network
        await chargeHandler.connect(alice).setApproval(gatewayToken.address, erc20.address, charge.value, gkn3);

        const FEES: IGatewayGatekeeper.GatekeeperFeesStruct = {
          issueFee: charge.value,
          refreshFee: charge.value,
          expireFee: charge.value,
          verificationFee: charge.value
        }

        await gatekeeperContract.connect(gatekeeper).updateFees(FEES, utils.formatBytes32String('GKN-3'));

        // create a mint transaction
        const tx = await gatewayToken.connect(gatekeeper).populateTransaction.mint(alice.address, gkn3, 0, 0, charge.partiesInCharge);

        // forward it so that Alice sends it
        await forward(tx, alice);

        // check that Alice's balance has gone down by the charge amount
        const balanceAfter = await erc20.balanceOf(alice.address);
        expect(balanceAfter).to.equal(balanceBefore.sub(charge.value));
      });

      it('can charge ERC20 through a forwarded call with a gatekeeper that meets minimum stake requirements', async () => {
        const charge = makeERC20Charge(BigNumber.from('100'), erc20.address, alice.address);

        await dummyErc20Contract.connect(identityCom).transfer(alice.address, BigNumber.from('100'));

        const balanceBefore = await erc20.balanceOf(alice.address);
        // Alice allows the gateway token contract to transfer 100 to the gatekeeper
        await erc20.connect(alice).approve(chargeHandler.address, charge.value);

        // Alice allows the gateway token contract to transfer 100 in the context of the gatekeeper network
        await chargeHandler.connect(alice).setApproval(gatewayToken.address, erc20.address, charge.value, gkn3);

        const MINIMUM_STAKE = 5000;

        // require a minimum amount of stake for gatekeepers
        await gatewayStakingContract.connect(identityCom).setMinimumGatekeeperStake(MINIMUM_STAKE);

        // gatekeeper deposit stake
        await giveDummyToken(gatekeeper, MINIMUM_STAKE * 2);
        await dummyErc20Contract.connect(gatekeeper).increaseAllowance(gatewayStakingContract.address, MINIMUM_STAKE);
        await gatewayStakingContract.connect(gatekeeper).depositStake(MINIMUM_STAKE, {gasLimit: 300000});

        const sharesBalance = await gatewayStakingContract.balanceOf(gatekeeper.address);

        expect(sharesBalance).to.be.eq(MINIMUM_STAKE);

        const FEES: IGatewayGatekeeper.GatekeeperFeesStruct = {
          issueFee: charge.value,
          refreshFee: charge.value,
          expireFee: charge.value,
          verificationFee: charge.value
        }

        await gatekeeperContract.connect(gatekeeper).updateFees(FEES, utils.formatBytes32String('GKN-3'));

        // create a mint transaction
        const tx = await gatewayToken.connect(gatekeeper).populateTransaction.mint(alice.address, gkn3, 0, 0, charge.partiesInCharge);

        // forward it so that Alice sends it
        await forward(tx, alice);

        // check that Alice's balance has gone down by the charge amount
        const balanceAfter = await erc20.balanceOf(alice.address);
        expect(balanceAfter).to.equal(balanceBefore.sub(charge.value));
      });

      it('can charge ERC20 through a forwarded call with network fees', async () => {
        const charge = makeERC20Charge(BigNumber.from('100'), erc20.address, alice.address);

        await dummyErc20Contract.connect(identityCom).transfer(alice.address, BigNumber.from('100'));

        const balanceBefore = await erc20.balanceOf(alice.address);
        const gatekeeperBalanceBefore = await erc20.balanceOf(gatekeeper.address);
        const networkBalanceBefore = await erc20.balanceOf(gatewayNetwork.address);

        // Alice allows the gateway token contract to transfer 100 to the gatekeeper
        await erc20.connect(alice).approve(chargeHandler.address, charge.value);

        //Alice allows the network contract to transfer funds to the network
        await erc20.connect(alice).approve(gatewayNetwork.address, charge.value);

        // Alice allows the gateway token contract to transfer 100 in the context of the gatekeeper network
        await chargeHandler.connect(alice).setApproval(gatewayToken.address, erc20.address, charge.value, gkn3);

        const FEES: IGatewayGatekeeper.GatekeeperFeesStruct = {
          issueFee: charge.value,
          refreshFee: charge.value,
          expireFee: charge.value,
          verificationFee: charge.value
        }

        const NETWORK_FEES_IN_BPS: IGatewayNetwork.NetworkFeesBpsStruct = {
          issueFee: 1000, // 10% fee [(100 bps) / 10_000]
          refreshFee: 1000, // 10% fee [(100 bps) / 10_000]
          expireFee: 1000, // 10% fee [(100 bps) / 10_000]
          verificationFee: 1000, // 10% fee [(100 bps) / 10_000]
        }

        // Fast forward blocks so that fees can be updated again
        const networkFeeConfigDelayInSeconds = await gatewayNetwork.FEE_CONFIG_DELAY_TIME();
        await time.increase(networkFeeConfigDelayInSeconds.toNumber());

        await gatekeeperContract.connect(gatekeeper).updateFees(FEES, utils.formatBytes32String('GKN-3'), { gasLimit: 1000000 });
        await gatewayNetwork.connect(identityCom).updateFees(NETWORK_FEES_IN_BPS, utils.formatBytes32String('GKN-3'), { gasLimit: 1000000 });

        // create a mint transaction
        const tx = await gatewayToken.connect(gatekeeper).populateTransaction.mint(alice.address, gkn3, 0, 0, charge.partiesInCharge);

        // forward it so that Alice sends it
        await forward(tx, alice);

        const gatekeeperFeePercentage = BigNumber.from(10000).sub(NETWORK_FEES_IN_BPS.issueFee as BigNumber); // 100% - 10%
        const gatekeeperFeeValue = charge.value.mul(gatekeeperFeePercentage).div(10000);

        const networkFeeValue = charge.value.mul(NETWORK_FEES_IN_BPS.issueFee as BigNumber).div(10000);

        // check that Alice's balance has gone down by the charge amount
        const balanceAfter = await erc20.balanceOf(alice.address);
        const gatekeeperBalanceAfter = await erc20.balanceOf(gatekeeper.address);
        const networkBalanceAfter = await erc20.balanceOf(gatewayNetwork.address);

        expect(balanceAfter).to.equal(balanceBefore.sub(charge.value));
        expect(gatekeeperBalanceAfter).to.equal(gatekeeperBalanceBefore.add(gatekeeperFeeValue));
        expect(networkBalanceAfter).to.equal(networkBalanceBefore.add(networkFeeValue));
      });

      it('charge ERC20 - allows someone else to forward and pay the fee', async () => {
        // Alice will be forwarding the tx and paying the fee on behalf of bob
        // no connection between the fee payer, forwarder and the gateway token recipient
        const charge = makeERC20Charge(BigNumber.from('100'), erc20.address, alice.address);

        await dummyErc20Contract.connect(identityCom).transfer(alice.address, BigNumber.from('100'));

        const balanceBefore = await erc20.balanceOf(alice.address);

        // Alice allows the gateway token contract to transfer 100 to the gatekeeper
        await erc20.connect(alice).approve(chargeHandler.address, charge.value);

        // Alice allows the gateway token contract to transfer 100 in the context of the gatekeeper network
        await chargeHandler.connect(alice).setApproval(gatewayToken.address, erc20.address, charge.value, gkn3);

        const FEES: IGatewayGatekeeper.GatekeeperFeesStruct = {
          issueFee: charge.value,
          refreshFee: charge.value,
          expireFee: charge.value,
          verificationFee: charge.value
        }

        await gatekeeperContract.connect(gatekeeper).updateFees(FEES, utils.formatBytes32String('GKN-3'), { gasLimit: 1000000 });

        // create a mint transaction for bob
        const tx = await gatewayToken.connect(gatekeeper).populateTransaction.mint(bob.address, gkn3, 0, 0, charge.partiesInCharge);

        // forward it so that Alice sends it
        await forward(tx, alice);

        // check that Alice's balance has gone down by the charge amount
        const balanceAfter = await erc20.balanceOf(alice.address);
        expect(balanceAfter).to.equal(balanceBefore.sub(charge.value));
      });

      it('charge ERC20 - allows someone else to pay the fee, without forwarding', async () => {
        // Bob will be forwarding the tx, but Alice will be paying the fee on behalf of bob
        // no connection between the fee payer, forwarder and the gateway token recipient
        const charge = makeERC20Charge(BigNumber.from('100'), erc20.address, alice.address);

        await dummyErc20Contract.connect(identityCom).transfer(alice.address, BigNumber.from('100'));

        const balanceBefore = await erc20.balanceOf(alice.address);

        // Alice allows the gateway token contract to transfer 100 to the gatekeeper
        await erc20.connect(alice).approve(chargeHandler.address, charge.value);

        // Alice allows the gateway token contract to transfer 100 in the context of the gatekeeper network
        await chargeHandler.connect(alice).setApproval(gatewayToken.address, erc20.address, charge.value, gkn3);

        const FEES: IGatewayGatekeeper.GatekeeperFeesStruct = {
          issueFee: charge.value,
          refreshFee: charge.value,
          expireFee: charge.value,
          verificationFee: charge.value
        }

        await gatekeeperContract.connect(gatekeeper).updateFees(FEES, utils.formatBytes32String('GKN-3'), { gasLimit: 1000000 });

        // create a mint transaction for bob
        const tx = await gatewayToken.connect(gatekeeper).populateTransaction.mint(bob.address, gkn3, 0, 0, charge.partiesInCharge);

        // forward it so that Bob sends it
        await forward(tx, bob);

        // check that Alice's balance has gone down by the charge amount
        const balanceAfter = await erc20.balanceOf(alice.address);
        expect(balanceAfter).to.equal(balanceBefore.sub(charge.value));
      });

      it('can charge ERC20 - rejects if the ERC20 transfer fails', async () => {
        const brokenErc20Factory = await ethers.getContractFactory('DummyBrokenERC20');
        const brokenErc20 = await brokenErc20Factory.deploy(
          'broken erc20',
          'dummyBroken',
          ethers.utils.parseEther('1000000'),
          alice.address,
        );
        await brokenErc20.deployed();

        // Create new gatekeeper network with broken token
        const networkFour = getNetwork(identityCom.address, 'GKN-4', brokenErc20.address);
        await gatewayNetwork.connect(identityCom).createNetwork(networkFour);
        await gatewayNetwork.connect(identityCom).addGatekeeper(gatekeeper.address.toString(), utils.formatBytes32String('GKN-4'));

        let gkn4 = await gatewayNetwork.getNetworkId(utils.formatBytes32String('GKN-4'));

        const charge = makeERC20Charge(BigNumber.from('100'), brokenErc20.address, alice.address);

        // Alice allows the gateway token contract to transfer 100 to the gatekeeper
        await brokenErc20.connect(alice).approve(chargeHandler.address, charge.value);
        // Alice allows the gateway token contract to transfer 100 in the context of the gatekeeper network
        await chargeHandler.connect(alice).setApproval(gatewayToken.address, brokenErc20.address, charge.value, gkn4);

        const FEES: IGatewayGatekeeper.GatekeeperFeesStruct = {
          issueFee: charge.value,
          refreshFee: charge.value,
          expireFee: charge.value,
          verificationFee: charge.value
        }

        await gatekeeperContract.connect(gatekeeper).updateFees(FEES, utils.formatBytes32String('GKN-4'), { gasLimit: 1000000 });
        
        // create a mint transaction
        const tx = await gatewayToken.connect(gatekeeper).populateTransaction.mint(alice.address, gkn4, 0, 0, charge.partiesInCharge);

        // the transfer fails because the erc20 contract blocked it
        await expect(forward(tx, alice)).to.be.revertedWith(/ERC20 operation did not succeed/);
      });

      it('can charge ERC20 - rejects if the charge handler is called directly', async () => {
        const charge = makeERC20Charge(BigNumber.from('100'), erc20.address, alice.address);

        await erc20.connect(identityCom).transfer(alice.address, BigNumber.from('100'));
        
        // Alice allows the gateway token contract to transfer 100 to the gatekeeper
        await erc20.connect(alice).approve(chargeHandler.address, charge.value);

        // Alice allows the gateway token contract to transfer 100 in the context of the gatekeeper network
        await chargeHandler.connect(alice).setApproval(gatewayToken.address, erc20.address, charge.value, gkn3);

        // attempt to call chargeHandler directly rather than via a gatewayToken mint
        const attacker = randomWallet();
        const maliciousCharge = {
          ...charge,
          partiesInCharge: {
            ...charge.partiesInCharge,
            recipient: attacker.address,
          }
        };

        // it doesn't matter who sends the transaction
        const shouldFail = chargeHandler.connect(alice).handleCharge(maliciousCharge, gkn3);


        await expect(shouldFail).to.be.revertedWith(/AccessControl/);
      });
    });
  });

  describe('Test gateway token future version upgradeability', async () => {

    beforeEach('reset gatekeepers', async () => {
  
      // re-create gatekeeper network
      const networkOne = getNetwork(identityCom.address, 'GKN-1');


      const networkOneFeeBalance = await gatewayNetwork.networkFeeBalances(networkOne.name);

      // withdraw fees from networks
      if(networkOneFeeBalance.gt(0)) { await gatewayNetwork.connect(identityCom).withdrawNetworkFees(networkOne.name, {gasLimit: 300000 })}


      // remove networks gatekeeper and close networks
      await gatewayNetwork.connect(identityCom).removeGatekeeper(gatekeeper.address, networkOne.name);

      await gatewayNetwork.connect(identityCom).closeNetwork(networkOne.name);
  
      // recreate networks so fees can be updated in each test
      await gatewayNetwork.connect(identityCom).createNetwork(networkOne);
  
      await gatewayNetwork.connect(identityCom).addGatekeeper(gatekeeper.address.toString(), utils.formatBytes32String('GKN-1'));
    });

    it('upgrades the gateway token contract to v2', async () => {
      const gatewayTokenV2Factory = await ethers.getContractFactory('GatewayTokenUpgradeTest');
      await upgrades.upgradeProxy(gatewayToken.address, gatewayTokenV2Factory);
    });

    it('existing tokens are still valid after the upgrade', async () => {
      let verified = await gatewayToken['verifyToken(address,uint256)'](alice.address, gkn1);
      expect(verified).to.be.true;
    });

    it('can issue a token with a positive expiry', async () => {
      const currentDate = await time.latest();
      const tomorrow = currentDate + (86_400);

      const FEES: IGatewayGatekeeper.GatekeeperFeesStruct = {
        issueFee: 0,
        refreshFee: 0,
        expireFee: 0,
        verificationFee: 0
      }
      // Remove gatekeeper fees
      await gatekeeperContract.connect(gatekeeper).updateFees(FEES, utils.formatBytes32String('GKN-1'), { gasLimit: 1000000 });

      const wallet = randomWallet();
      await gatewayToken.connect(gatekeeper).mint(wallet.address, gkn1, tomorrow, 0, {
        recipient: gatekeeper.address,
        tokenSender: ZERO_ADDRESS,
      });

      let verified = await gatewayToken['verifyToken(address,uint256)'](wallet.address, gkn1);
      expect(verified).to.be.true;
    });

    it('can no longer issue a token with no expiry (testing the upgraded behaviour)', async () => {
      const wallet = randomWallet();

      await gatewayNetwork.connect(identityCom).updatePassExpirationTime(0,utils.formatBytes32String('GKN-1'));
      
      await gatewayNetwork.connect(identityCom).updatePassExpirationTime(0, gkn1);
      await expect(gatewayToken.connect(gatekeeper).mint(wallet.address, gkn1, 0, 0, NULL_CHARGE)).to.be.revertedWith(
        'TEST MODE: Expiry must be > zero',
      );
    });

    it('upgrades the flags storage contract to v2 - reverts if not superadmin', async () => {
      // just using the same contract here, to test the upgradeability feature
      const flagsStorageV2Factory = await ethers.getContractFactory('FlagsStorage');
      await expect(
        upgrades.upgradeProxy(flagsStorage.address, flagsStorageV2Factory.connect(bob)),
      ).to.be.revertedWithCustomError(gatewayToken, 'Common__NotSuperAdmin');
    });

    it('upgrades the charge handler contract to v2', async () => {
      // just using the same contract here, to test the upgradeability feature
      const chargeHandlerV2Factory = await ethers.getContractFactory('ChargeHandler');
      await upgrades.upgradeProxy(chargeHandler.address, chargeHandlerV2Factory);
    });

    it('upgrades the charge handler contract to v2 - reverts if not superadmin', async () => {
      // just using the same contract here, to test the upgradeability feature
      const chargeHandlerV2Factory = await ethers.getContractFactory('ChargeHandler');
      await expect(
        upgrades.upgradeProxy(chargeHandler.address, chargeHandlerV2Factory.connect(bob)),
      ).to.be.revertedWith(/AccessControl/);
    });
  });

});
