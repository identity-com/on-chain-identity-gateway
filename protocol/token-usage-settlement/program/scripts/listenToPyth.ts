import {
  getPythProgramKeyForCluster,
  PythConnection,
} from "@pythnetwork/client";
import { clusterApiUrl, Connection } from "@solana/web3.js";

const connection = new Connection(clusterApiUrl("mainnet-beta"), "confirmed");
const pythConnection = new PythConnection(
  connection,
  getPythProgramKeyForCluster("mainnet-beta")
);
pythConnection.onPriceChange((product, price) => {
  // sample output:
  // SRM/USD: $8.68725 ±$0.0131
  console.log(`${product.symbol}: $${price.price} \xB1$${price.confidence}`);
});

// Start listening for price change events.
pythConnection.start();
