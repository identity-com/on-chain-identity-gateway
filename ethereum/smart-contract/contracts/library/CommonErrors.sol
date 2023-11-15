// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.19;

/// The passed-in account is the zero-address
error Common__MissingAccount();

/// The passed-in account is not a contract, where an account is expected
/// @param account address of the account.
error Common__NotContract(address account);

/// The passed-in account is not a super-admin
/// @param account address of the account.
error Common__NotSuperAdmin(address account);

/// The request was made from an unauthorized address.
/// @param sender address of the sender.
/// @param domain the domain to which the role applies.
/// @param role role that is required.
error Common__Unauthorized(address sender, uint domain, bytes32 role);
