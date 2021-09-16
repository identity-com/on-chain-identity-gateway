// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IGatewayToken {
    /**
    * @dev Emitted when GatewayToken allowed to transfer for token owners by `account`.
    */
    event TransfersAccepted(address account);

    /**
    * @dev Emitted when GatewayToken restricted to transfer for token owners by `account`.
    */
    event TransfersRestricted(address account);

    /**
    * @dev Emitted when GatewayToken DAO Manager transfered to `newDAOManager` address.
    */
    event DAOManagerTransfered(address previousDAOManager, address newDAOManager);

    /**
    * @dev Triggers to get all information relating to gateway `tokenId`
    * @param tokenId Gateway token id
    */
    function getToken(uint256 tokenId) 
        external 
        view  
        returns (
            address owner,
            uint8 state,
            string memory identity,
            uint256 expiration,
            uint256 bitmask
        );

    /**
    * @dev Triggers to get gateway token state with specified `tokenId`
    * @param tokenId Gateway token id
    */
    function getTokenState(uint256 tokenId) external view virtual returns (uint8 state);

    /**
    * @dev Triggers to get default gateway token ID for `owner`
    * @param owner Token owner address
    */
    function getTokenId(address owner) external returns (uint256);

    /**
    * @dev Triggers to set token with specified `tokenId` as default for `owner`
    * @param owner  Token owner address
    * @param tokenId Gateway token id
    */
    function setDefaultTokenId(address owner, uint256 tokenId) external;

    /**
    * @dev Triggers to verify if address has a GATEKEEPER role. 
    * @param gatekeeper Gatekeeper address
    */
    function isGatekeeper(address gatekeeper) external returns (bool);

    /**
    * @dev Triggers to add new network authority into the system. 
    * @param authority Network Authority address
    *
    * @notice Only triggered by Identity.com Admin
    */
    function addNetworkAuthority(address authority) external;

    /**
    * @dev Triggers to remove existing network authority from gateway token. 
    * @param authority Network Authority address
    *
    * @notice Only triggered by Identity.com Admin
    */
    function removeNetworkAuthority(address authority) external;

    /**
    * @dev Triggers to verify if authority has a NETWORK_AUTHORITY_ROLE role. 
    * @param authority Network Authority address
    */
    function isNetworkAuthority(address authority) external returns (bool);

    /**
    * @dev Triggers to allow token transfers by token owners. 
    *
    * @notice Only triggered by Identity.com Admin
    */
    function allowTransfers() external returns (bool);

    /**
    * @dev Triggers to stop token transfers by token owners. 
    *
    * @notice Only triggered by Identity.com Admin
    */
    function stopTransfers() external returns (bool);

    /**
    * @dev Triggers to check if token governed by DAO. 
    */
    function isDAOGoverned() external returns (bool);

    /**
    * @dev Triggers to get DAO Manager address. 
    */
    function daoManager() external returns (address);

    /**
    * @dev Transfers Gateway Token DAO Manager access from daoManager to `newManager`
    * @param newManager Address to transfer DAO Manager role for.
    */
    function transferDAOManager(address newManager) external;
}