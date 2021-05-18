import * as geoip from "geoip-country";
const COUNTRY_BLACKLIST = ["US"];

export const ipLookup = (ip: string) => geoip.lookup(ip);
export const validIp = (ip: string) => {
  const ipDetails = ipLookup(ip);
  return ipDetails && !COUNTRY_BLACKLIST.includes(ipDetails.country);
};
