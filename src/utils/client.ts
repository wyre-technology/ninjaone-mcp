/**
 * Lazy-loaded NinjaOne client
 *
 * This module provides lazy initialization of the NinjaOne client
 * to avoid loading the entire library upfront.
 */

import type { NinjaOneClient } from "@wyre-technology/node-ninjaone";
import { isValidRegion, getBaseUrlForRegion, type NinjaOneRegion } from "./types.js";

export interface NinjaOneCredentials {
  clientId: string;
  clientSecret: string;
  region: NinjaOneRegion;
  baseUrl: string;
}

let _client: NinjaOneClient | null = null;
let _credentials: NinjaOneCredentials | null = null;

/**
 * Get credentials from environment variables
 */
export function getCredentials(): NinjaOneCredentials | null {
  const clientId = process.env.NINJAONE_CLIENT_ID;
  const clientSecret = process.env.NINJAONE_CLIENT_SECRET;
  const regionEnv = process.env.NINJAONE_REGION?.toLowerCase() || "us";

  if (!clientId || !clientSecret) {
    return null;
  }

  if (!isValidRegion(regionEnv)) {
    return null;
  }

  const region = regionEnv as NinjaOneRegion;
  const baseUrl = getBaseUrlForRegion(region);

  return { clientId, clientSecret, region, baseUrl };
}

/**
 * Get or create the NinjaOne client (lazy initialization)
 */
export async function getClient(): Promise<NinjaOneClient> {
  const creds = getCredentials();

  if (!creds) {
    throw new Error(
      "No API credentials provided. Please configure NINJAONE_CLIENT_ID, NINJAONE_CLIENT_SECRET, and optionally NINJAONE_REGION (us, eu, oc) environment variables."
    );
  }

  // If credentials changed, invalidate the cached client
  if (
    _client &&
    _credentials &&
    (creds.clientId !== _credentials.clientId ||
      creds.clientSecret !== _credentials.clientSecret ||
      creds.region !== _credentials.region)
  ) {
    _client = null;
  }

  if (!_client) {
    // Lazy import the library
    const { NinjaOneClient } = await import("@wyre-technology/node-ninjaone");
    _client = new NinjaOneClient({
      clientId: creds.clientId,
      clientSecret: creds.clientSecret,
      baseUrl: creds.baseUrl,
    });
    _credentials = creds;
  }

  return _client;
}

/**
 * Clear the cached client (useful for testing)
 */
export function clearClient(): void {
  _client = null;
  _credentials = null;
}