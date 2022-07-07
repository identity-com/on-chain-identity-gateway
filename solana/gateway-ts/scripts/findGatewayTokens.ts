/**
 * Get all gateway tokens on a given network (optionally for a given wallet)
 *
 * ## Usage
 * ```
 * yarn ts-node scripts/findGatewayTokens.ts <gatekeeperNetwork> [walletAddress]
 * ```
 *
 * Use a custom RPC endpoint by setting the CLUSTER_ENDPOINT environment variable.
 *
 * ## Pagination
 *
 * If a large number of tokens has been issued, the request to the RPC endpoint may time out.
 * In this case, enable pagination by setting the PAGINATE=1 environment variable.
 * Pagination is not supported in the RPC API, but this approximates it by
 * adding another filter on the first byte of the owner address.
 * Each page requests the accounts that match the next byte.
 */

import { clusterApiUrl, Connection, PublicKey } from "@solana/web3.js";
import { findGatewayTokens, GatewayToken } from "../src";

const SEPARATOR = ",";

const [gatekeeperNetworkString, walletAddressString] = process.argv.slice(2);

if (!gatekeeperNetworkString) throw new Error("Missing gatekeeper network");

// default to the civic cluster
const endpoint = process.env.CLUSTER_ENDPOINT || clusterApiUrl("mainnet-beta");
const connection = new Connection(endpoint, "processed");

const gatekeeperNetwork = new PublicKey(gatekeeperNetworkString);
const walletAddress = walletAddressString
  ? new PublicKey(walletAddressString)
  : undefined;

const extractData = (gatewayToken: GatewayToken) => ({
  owner: gatewayToken.owner.toBase58(),
  gatekeeperNetwork: gatewayToken.gatekeeperNetwork.toBase58(),
  gatekeeper: gatewayToken.issuingGatekeeper.toBase58(),
  valid: gatewayToken.isValid(),
});

const prettyPrint = (extractedGatewayToken: ReturnType<typeof extractData>) =>
  `${extractedGatewayToken.owner}${SEPARATOR}${extractedGatewayToken.gatekeeperNetwork}${SEPARATOR}${extractedGatewayToken.gatekeeper}${SEPARATOR}${extractedGatewayToken.valid}`;

const fetchPage = async (page?: number): Promise<GatewayToken[]> => {
  const tokens = await findGatewayTokens(
    connection,
    walletAddress,
    gatekeeperNetwork,
    false,
    page
  );

  if (tokens.length > 0) {
    tokens
      .map(extractData)
      .map(prettyPrint)
      .forEach((t) => console.log(t));
  }

  return tokens;
};

(async () => {
  console.log(
    `Owner${SEPARATOR}Gatekeeper Network${SEPARATOR}Issuing Gatekeeper${SEPARATOR}Valid`
  );
  if (process.env.PAGINATE) {
    for (let i = 0; i <= 255; i++) {
      console.error(`Page ${i + 1}/256`);
      await fetchPage(i);
    }
  } else {
    await fetchPage();
  }
})().catch((error) => console.error(error));
