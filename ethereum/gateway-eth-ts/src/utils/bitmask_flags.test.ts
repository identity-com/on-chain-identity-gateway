import { addFlagsToBitmask } from './bitmask_flags';
import { KYCFlags } from '../lib/flags';
import { ZERO_BN } from './constants';
import { BigNumber } from '@ethersproject/bignumber';
import assert = require('assert');

describe('Bitmask KYC flags test', function() {
    let bitmask:BigNumber = ZERO_BN;
    let flags: KYCFlags[] | number[];

    describe('Try to add supported flags', function() {
        it('Should return bitmask == 1 on adding flag with 0 index', function() {
            flags = [KYCFlags.IDCOM_1];
            bitmask = addFlagsToBitmask(bitmask, flags);
            assert.equal(bitmask.toString(), '1');
        });

        it('Should return bitmask == 2 on adding flag with 1 index', function() {
            flags = [1];
            bitmask = addFlagsToBitmask(ZERO_BN, flags);
            assert.equal(bitmask.toString(), '2');
        });

        it('Should return bitmask == 4 on adding flag with 2 index', function() {
            flags = [KYCFlags.IDCOM_3];
            bitmask = addFlagsToBitmask(ZERO_BN, flags);
            assert.equal(bitmask.toString(), '4');
        });
    });

    describe('Try to add non-supported flags', function() {
        it('Should return bitmask == 0 on adding flag with 4 index', function() {
            flags = [4];
            bitmask = addFlagsToBitmask(ZERO_BN, flags);
            assert.equal(bitmask.toString(), '0');
        });

        it('Should return bitmask == 0 on adding flags with indexes 5, 6, 7, 8, and 9', function() {
            flags = [5, 6, 7, 8, 9];
            bitmask = addFlagsToBitmask(ZERO_BN, flags);
            assert.equal(bitmask.toString(), '0');
        });
    });
});