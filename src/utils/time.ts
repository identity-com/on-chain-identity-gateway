import { DEFAULT_EXPIRATION } from "./constants";

export const getExpirationTime = (expiration?: number): number | undefined => {
    const now = Math.floor(Date.now() / 1000);

    if (expiration != null) {
        return now + expiration;    
    } else {
        if (!DEFAULT_EXPIRATION) return undefined;
        return now + DEFAULT_EXPIRATION;    
    } 
  }
