import { addresses } from '../lib/addresses';
import { gatewayTokenAddresses, GatewayTokenItem } from '../lib/gatewaytokens';

export interface GatewayTokenItems {
    [address: string]: GatewayTokenItem
}

export const getGatewayControllerByNetworkID = (networkID: number = 1) => {
    return addresses[networkID].gatewayTokenController
}

export const getGatewayTokenByName = (name: string, networkID: number = 1): string => {
    return gatewayTokenAddresses[networkID].find((gatewayToken: GatewayTokenItem) => {
        name == gatewayToken.name
    }).address;
}

export const getGatewayTokenBySymbol = (symbol: string, networkID: number = 1): GatewayTokenItem => {
    return gatewayTokenAddresses[networkID].find((gatewayToken: GatewayTokenItem) => {
        symbol == gatewayToken.symbol
    });
}

export const getGatewayTokenByAddress = (address: string, networkID: number = 1): GatewayTokenItem => {
    return gatewayTokenAddresses[networkID].find((gatewayToken: GatewayTokenItem) => {
        address == gatewayToken.address
    });
}
