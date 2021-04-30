export const gatekeeperServerBaseUrl = 'https://dev.api.civic.com/ociv-gatekeeper-preprod';
export const MINT_AUTHORITY_PUBLIC_KEY = 'NkiD7m7LDj5z1mmfdBt9YuP7E46W3ZakopLRqmLqykT';
export const civicNetEndpoint = 'https://d3ab7dlfud2b5u.cloudfront.net';

const nonUsIPAddress = '185.6.234.109';
export const nonUsIPOverrideHeaders = { 'x-civic-test-ipoverride': nonUsIPAddress };

export const wait = (waitMs: number, message = ''): Promise<void> => {
  if (message) console.log(message);
  return new Promise((resolve) => setTimeout(resolve, waitMs));
};
