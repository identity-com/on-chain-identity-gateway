import {Connection, Keypair, PublicKey, Transaction} from "@solana/web3.js";
import {
  freeze,
  GatewayToken,
  getGatekeeperAccountKeyFromGatekeeperAuthority,
  getGatewayToken,
  getGatewayTokenKeyForOwner,
  issueVanilla,
  revoke,
  unfreeze,
  updateExpiry,
} from "@identity.com/solana-gateway-ts";
import {send} from "../util/connection";

type GatekeeperConfig = {
  defaultExpirySeconds?: number;
};

export class GatekeeperService {
  constructor(
    private connection: Connection,
    private payer: Keypair,
    private gatekeeperNetwork: PublicKey,
    private gatekeeperAuthority: Keypair,
    private config: GatekeeperConfig = {}
  ) {}

  private getDefaultExpireTime(): number | undefined {
    if (!this.config.defaultExpirySeconds) return undefined;
    const now = Math.floor(Date.now() / 1000);
    return now + this.config.defaultExpirySeconds;
  }

  private getGatewayTokenOrError(
    gatewayTokenKey: PublicKey
  ): Promise<GatewayToken> {
    return getGatewayToken(this.connection, gatewayTokenKey).then(
      (gatewayToken) => {
        if (!gatewayToken)
          throw new Error(
            "Error retrieving gateway token at address " + gatewayTokenKey
          );
        return gatewayToken;
      }
    );
  }

  private async issueVanilla(
    owner: PublicKey,
    seed?: Uint8Array
  ): Promise<GatewayToken> {
    const gatewayTokenKey = await getGatewayTokenKeyForOwner(owner);
    const gatekeeperAccount =
      await getGatekeeperAccountKeyFromGatekeeperAuthority(
        this.gatekeeperAuthority.publicKey
      );

    const expireTime = this.getDefaultExpireTime();

    const transaction = new Transaction().add(
      issueVanilla(
        gatewayTokenKey,
        this.payer.publicKey,
        gatekeeperAccount,
        owner,
        this.gatekeeperAuthority.publicKey,
        this.gatekeeperNetwork,
        seed,
        expireTime
      )
    );

    await send(
      this.connection,
      transaction,
      this.payer,
      this.gatekeeperAuthority
    );

    return this.getGatewayTokenOrError(gatewayTokenKey);
  }

  issue(recipient: PublicKey): Promise<GatewayToken> {
    return this.issueVanilla(recipient);
  }

  async revoke(gatewayTokenKey: PublicKey): Promise<GatewayToken> {
    const gatekeeperAccount =
      await getGatekeeperAccountKeyFromGatekeeperAuthority(
        this.gatekeeperAuthority.publicKey
      );
    console.log("gatekeeperAccount", gatekeeperAccount.toBase58());
    const transaction = new Transaction().add(
      revoke(
        gatewayTokenKey,
        this.gatekeeperAuthority.publicKey,
        gatekeeperAccount
      )
    );

    await send(this.connection, transaction, this.gatekeeperAuthority);

    return this.getGatewayTokenOrError(gatewayTokenKey);
  }

  async freeze(gatewayTokenKey: PublicKey): Promise<GatewayToken> {
    const gatekeeperAccount =
      await getGatekeeperAccountKeyFromGatekeeperAuthority(
        this.gatekeeperAuthority.publicKey
      );
    console.log("gatekeeperAccount", gatekeeperAccount.toBase58());
    const transaction = new Transaction().add(
      freeze(
        gatewayTokenKey,
        this.gatekeeperAuthority.publicKey,
        gatekeeperAccount
      )
    );

    await send(this.connection, transaction, this.gatekeeperAuthority);

    return this.getGatewayTokenOrError(gatewayTokenKey);
  }

  async unfreeze(gatewayTokenKey: PublicKey): Promise<GatewayToken> {
    const gatekeeperAccount =
      await getGatekeeperAccountKeyFromGatekeeperAuthority(
        this.gatekeeperAuthority.publicKey
      );
    console.log("gatekeeperAccount", gatekeeperAccount.toBase58());
    const transaction = new Transaction().add(
      unfreeze(
        gatewayTokenKey,
        this.gatekeeperAuthority.publicKey,
        gatekeeperAccount
      )
    );

    await send(this.connection, transaction, this.gatekeeperAuthority);

    return this.getGatewayTokenOrError(gatewayTokenKey);
  }

  async updateExpiry(
    gatewayTokenKey: PublicKey,
    expireTime: number
  ): Promise<GatewayToken> {
    const gatekeeperAccount =
      await getGatekeeperAccountKeyFromGatekeeperAuthority(
        this.gatekeeperAuthority.publicKey
      );
    const transaction = new Transaction().add(
      updateExpiry(
        gatewayTokenKey,
        this.gatekeeperAuthority.publicKey,
        gatekeeperAccount,
        expireTime
      )
    );

    await send(this.connection, transaction, this.gatekeeperAuthority);

    return this.getGatewayTokenOrError(gatewayTokenKey);
  }
}
