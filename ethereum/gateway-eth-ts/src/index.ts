export { GatewayTs } from "./service/GatewayTs";
export { GatewayTsForwarder } from "./service/GatewayTsForwarder";
export {
  TokenData,
  TokenState,
  DEFAULT_GATEWAY_TOKEN_ADDRESS,
  DEFAULT_FORWARDER_ADDRESS,
  DEFAULT_FLAGS_STORAGE_ADDRESS,
  onGatewayTokenChange,
  removeGatewayTokenChangeListener,
} from "./utils";

import GatewayToken from "./contracts/abi/GatewayToken.sol/GatewayToken.json";
import FlexibleNonceForwarder from "./contracts/abi/FlexibleNonceForwarder.sol/FlexibleNonceForwarder.json";
import FlagsStorage from "./contracts/abi/FlagsStorage.sol/FlagsStorage.json";

export const abi = {
  GatewayToken,
  FlexibleNonceForwarder,
  FlagsStorage,
};
