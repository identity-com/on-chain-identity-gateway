import { Command, flags } from "@oclif/command";
import { PublicKey } from "@solana/web3.js";
import * as geoip from "geoip-country";

import { getGatekeeper } from "../util/account";
import { getConnection } from "../util/connection";
import * as fs from "fs";
import { IssueService } from "../service/issue";
import { COUNTRY_BLACKLIST, REGISTER } from "../util/constants";

type Record = {
  timestamp: string;
  token: string;
  name: string;
  ipAddress: string;
  country: string;
  approved: boolean;
};

const store = (record: Record) => {
  const row =
    [
      record.timestamp,
      record.token,
      record.name,
      record.ipAddress,
      record.country,
      record.approved,
    ].join(",") + "\n";
  fs.appendFileSync(REGISTER, row);
};

export default class Issue extends Command {
  static description = "Issue a gateway token";

  static examples = [
    `$ ociv issue EzZgkwaDrgycsiyGeCVRXXRcieE1fxhGMp829qwj5TMv
2QJjjrzdPSrcZUuAH2KrEU61crWz49KnSLSzwjDUnLSV
`,
  ];

  static flags = {
    help: flags.help({ char: "h" }),
    name: flags.string({ char: "n" }),
    ip: flags.string({ char: "i" }),
  };

  static args = [
    {
      name: "address",
      required: true,
      description: "The address to issue the token to",
      parse: (input: string) => new PublicKey(input),
    },
  ];

  async run() {
    const { args, flags } = this.parse(Issue);

    const address: PublicKey = args.address;
    this.log(`Issuing to ${address.toBase58()}`);

    const connection = await getConnection();
    const { gatekeeper, mintAccountPublicKey } = await getGatekeeper(
      connection
    );

    const service = new IssueService(
      connection,
      gatekeeper,
      mintAccountPublicKey
    );
    const record = await service.issue(address, flags);

    console.log(record.token);
  }
}
