/**
 * Lazy-loaded NinjaOne client
 *
 * This module provides lazy initialization of the NinjaOne client
 * to avoid loading the entire library upfront.
 */

import type { NinjaOneClient } from "@wyre-technology/node-ninjaone";
import { isValidRegion, getBaseUrlForRegion, type NinjaOneRegion } from "./types.js";
import { logger } from "./logger.js";

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
    logger.warn("Missing credentials", {
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret,
    });
    return null;
  }

  if (!isValidRegion(regionEnv)) {
    logger.warn("Invalid region configured", { region: regionEnv, valid: ["us", "eu", "oc"] });
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
    logger.info("Credentials changed, recreating client");
    _client = null;
  }

  if (!_client) {
    try {
      const { NinjaOneClient } = await import("@wyre-technology/node-ninjaone");
      logger.info("Creating NinjaOne client", { region: creds.region, baseUrl: creds.baseUrl });
      _client = new NinjaOneClient({
        clientId: creds.clientId,
        clientSecret: creds.clientSecret,
        baseUrl: creds.baseUrl,
      });
      _credentials = creds;
    } catch (error) {
      logger.error("Failed to create NinjaOne client", {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
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