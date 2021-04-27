export const gatekeeperServerBaseUrl = 'https://8prsxs9myf.execute-api.us-east-1.amazonaws.com/prod';
export const MINT_AUTHORITY_PUBLIC_KEY = 'NkiD7m7LDj5z1mmfdBt9YuP7E46W3ZakopLRqmLqykT';
export const civicNetEndpoint = 'https://d3ab7dlfud2b5u.cloudfront.net';

export const wait = (waitMs: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, waitMs));
