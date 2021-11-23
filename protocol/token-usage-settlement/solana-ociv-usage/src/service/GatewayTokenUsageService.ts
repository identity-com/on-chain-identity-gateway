import { Connection, Keypair, PublicKey } from "@solana/web3.js";

export const readUsageData = () => {
  return "";
};

export class GatewayTokenUsageService {
  /**
   * Construct a new GatekeeperService instance
   * @param connection A solana connection object
   * @param gatekeeperNetwork The network that the gatekeeper belongs to
   * @param gatekeeperAuthority The gatekeeper's key
   */
  constructor(
    private connection: Connection | null,
    private gatekeeperNetwork: PublicKey | null,
    private gatekeeperAuthority: Keypair | null
  ) {}

  readUsage() {
    return "TODO!";
  }
}
