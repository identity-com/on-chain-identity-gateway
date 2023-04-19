// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v4.8.0) (access/AccessControl.sol)

pragma solidity 0.8.9;

import {ContextUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {ERC165} from "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import {IParameterizedAccessControl} from "./interfaces/IParameterizedAccessControl.sol";
import {Common__Unauthorized, Common__NotSuperAdmin} from "./library/CommonErrors.sol";

/**
 * @dev Contract module that allows children to implement role-based access
 * control mechanisms. This is a lightweight version that doesn't allow enumerating role
 * members except through off-chain means by accessing the contract event logs. Some
 * applications may benefit from on-chain enumerability, for those cases see
 * {AccessControlEnumerable}.
 *
 * Roles are referred to by their `bytes32` identifier. These should be exposed
 * in the external API and be unique. The best way to achieve this is by
 * using `public constant` hash digests:
 *
 * ```
 * bytes32 public constant MY_ROLE = keccak256("MY_ROLE");
 * ```
 *
 * Roles can be used to represent a set of permissions. To restrict access to a
 * function call, use {hasRole}:
 *
 * ```
 * function foo() public {
 *     require(hasRole(MY_ROLE, msg.sender));
 *     ...
 * }
 * ```
 *
 * Roles can be granted and revoked dynamically via the {grantRole} and
 * {revokeRole} functions. Each role has an associated admin role, and only
 * accounts that have a role's admin role can call {grantRole} and {revokeRole}.
 *
 * By default, the admin role for all roles is `DEFAULT_ADMIN_ROLE`, which means
 * that only accounts with this role will be able to grant or revoke other
 * roles. More complex role relationships can be created by using
 * {_setRoleAdmin}.
 *
 * WARNING: The `DEFAULT_ADMIN_ROLE` is also its own admin: it has permission to
 * grant and revoke this role. Extra precautions should be taken to secure
 * accounts that have been granted it.
 */
abstract contract ParameterizedAccessControl is ContextUpgradeable, IParameterizedAccessControl, ERC165 {
    struct RoleData {
        mapping(address => bool) members;
        bytes32 adminRole;
    }

    struct RoleDomain {
        mapping(bytes32 => RoleData) roles;
    }

    mapping(uint256 => RoleDomain) private _roleDomain;
    mapping(address => bool) internal _superAdmins;

    bytes32 public constant DEFAULT_ADMIN_ROLE = 0x00;

    /**
     * @dev Modifier that checks that an account has a specific role.
     */
    modifier onlyRole(bytes32 role, uint256 domain) {
        _checkRole(role, domain);
        _;
    }

    /**
     * @dev Modifier that checks that an account is a super admin. Reverts if not.
     */
    modifier onlySuperAdmin() {
        _onlySuperAdmin();
        _;
    }

    function setSuperAdmin(address account) external onlySuperAdmin {
        emit SuperAdminAdded(account);
        _superAdmins[account] = true;
    }

    function revokeSuperAdmin(address account) external onlySuperAdmin {
        emit SuperAdminRemoved(account);
        _superAdmins[account] = false;
    }

    /**
     * @dev Grants `role` to `account`.
     *
     * If `account` had not been already granted `role`, emits a {RoleGranted}
     * event.
     *
     * Requirements:
     *
     * - the caller must have ``role``'s admin role.
     *
     * May emit a {RoleGranted} event.
     */
    function grantRole(
        bytes32 role,
        uint256 domain,
        address account
    ) public virtual override onlyRole(getRoleAdmin(role, domain), domain) {
        _grantRole(role, domain, account);
    }

    /**
     * @dev Revokes `role` from `account`.
     *
     * If `account` had been granted `role`, emits a {RoleRevoked} event.
     *
     * Requirements:
     *
     * - the caller must have ``role``'s admin role.
     *
     * May emit a {RoleRevoked} event.
     */
    function revokeRole(
        bytes32 role,
        uint256 domain,
        address account
    ) public virtual override onlyRole(getRoleAdmin(role, domain), domain) {
        _revokeRole(role, domain, account);
    }

    /**
     * @dev Revokes `role` from the calling account.
     *
     * Roles are often managed via {grantRole} and {revokeRole}: this function's
     * purpose is to provide a mechanism for accounts to lose their privileges
     * if they are compromised (such as when a trusted device is misplaced).
     *
     * If the calling account had been revoked `role`, emits a {RoleRevoked}
     * event.
     *
     * Requirements:
     *
     * - the caller must be `account`.
     *
     * May emit a {RoleRevoked} event.
     */
    function renounceRole(bytes32 role, uint256 domain, address account) public virtual override {
        if (account != _msgSender()) revert ParameterizedAccessControl__RenounceRoleNotForSelf(role, account);

        _revokeRole(role, domain, account);
    }

    function isSuperAdmin(address account) public view returns (bool) {
        return _superAdmins[account];
    }

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return interfaceId == type(IParameterizedAccessControl).interfaceId || super.supportsInterface(interfaceId);
    }

    /**
     * @dev Returns `true` if `account` has been granted `role`.
     */
    function hasRole(bytes32 role, uint256 domain, address account) public view virtual override returns (bool) {
        return _roleDomain[domain].roles[role].members[account];
    }

    /**
     * @dev Returns the admin role that controls `role`. See {grantRole} and
     * {revokeRole}.
     *
     * To change a role's admin, use {_setRoleAdmin}.
     */
    function getRoleAdmin(bytes32 role, uint256 domain) public view virtual override returns (bytes32) {
        return _roleDomain[domain].roles[role].adminRole;
    }

    /**
     * @dev Sets `adminRole` as ``role``'s admin role.
     *
     * Internal function without access restriction.
     *
     * [WARNING]
     * ====
     * This function should only be called from when setting
     * up the initial roles for the system or domain.
     *
     * Using this function in any other way is effectively circumventing the admin
     * system imposed by {ParameterizedAccessControl}.
     * ====
     *
     * Emits a {RoleAdminChanged} event.
     */
    function _setRoleAdmin(bytes32 role, uint256 domain, bytes32 adminRole) internal virtual {
        bytes32 previousAdminRole = getRoleAdmin(role, domain);
        _roleDomain[domain].roles[role].adminRole = adminRole;
        emit RoleAdminChanged(role, domain, previousAdminRole, adminRole);
    }

    /**
     * @dev Grants `role` to `account`.
     *
     * Internal function without access restriction.
     *
     * [WARNING]
     * ====
     * This function should only be called from when setting
     * up the initial roles for the system or domain.
     *
     * Using this function in any other way is effectively circumventing the admin
     * system imposed by {ParameterizedAccessControl}.
     * ====
     *
     * May emit a {RoleGranted} event.
     */
    function _grantRole(bytes32 role, uint256 domain, address account) internal virtual {
        if (!hasRole(role, domain, account)) {
            _roleDomain[domain].roles[role].members[account] = true;
            emit RoleGranted(role, domain, account, _msgSender());
        }
    }

    /**
     * @dev Revokes `role` from `account`.
     *
     * Internal function without access restriction.
     *
     * May emit a {RoleRevoked} event.
     */
    function _revokeRole(bytes32 role, uint256 domain, address account) internal virtual {
        if (hasRole(role, domain, account)) {
            _roleDomain[domain].roles[role].members[account] = false;
            emit RoleRevoked(role, domain, account, _msgSender());
        }
    }

    /**
     * @dev Revert if `_msgSender()` is missing `role`.
     * Overriding this function changes the behavior of the {onlyRole} modifier.
     *
     * _Available since v4.6._
     */
    function _checkRole(bytes32 role, uint256 domain) internal view virtual {
        _checkRole(role, domain, _msgSender());
    }

    /**
     * @dev Revert if `account` is missing `role`.
     *
     */
    function _checkRole(bytes32 role, uint256 domain, address account) internal view virtual {
        if (!hasRole(role, domain, account)) {
            revert Common__Unauthorized(account, domain, role);
        }
    }

    /**
     * @dev Revert if `account` is not a super admin
     */
    function _checkAdmin(address account) internal view virtual {
        if (!isSuperAdmin(account)) revert Common__NotSuperAdmin(account);
    }

    // separate into a private function to reduce code size
    function _onlySuperAdmin() private view {
        _checkAdmin(_msgSender());
    }
}
