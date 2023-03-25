// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import {MinimalForwarder} from "@openzeppelin/contracts/metatx/MinimalForwarder.sol";

/// Implementation of a MinimalForwarder from OpenZeppelin, with no additional logic,
/// so that it can be deployed as part of the set of contracts.
/// Note - although this forwarder is added to the gateway token as a trusted forwarder,
/// in practice,
contract Forwarder is MinimalForwarder {
    // solhint-disable-next-line no-empty-blocks
    constructor() MinimalForwarder() {}
}
