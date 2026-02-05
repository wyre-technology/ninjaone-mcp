/**
 * Tests for shared types and utility functions
 */

import { describe, it, expect } from "vitest";
import {
  isDomainName,
  isValidRegion,
  getBaseUrlForRegion,
} from "../utils/types.js";

describe("Type Utilities", () => {
  describe("isDomainName", () => {
    it("should return true for valid domain names", () => {
      expect(isDomainName("devices")).toBe(true);
      expect(isDomainName("organizations")).toBe(true);
      expect(isDomainName("alerts")).toBe(true);
      expect(isDomainName("tickets")).toBe(true);
    });

    it("should return false for invalid domain names", () => {
      expect(isDomainName("invalid")).toBe(false);
      expect(isDomainName("")).toBe(false);
      expect(isDomainName("DEVICES")).toBe(false);
      expect(isDomainName("device")).toBe(false);
      expect(isDomainName("customers")).toBe(false);
    });
  });

  describe("isValidRegion", () => {
    it("should return true for valid regions", () => {
      expect(isValidRegion("us")).toBe(true);
      expect(isValidRegion("eu")).toBe(true);
      expect(isValidRegion("oc")).toBe(true);
    });

    it("should return false for invalid regions", () => {
      expect(isValidRegion("invalid")).toBe(false);
      expect(isValidRegion("")).toBe(false);
      expect(isValidRegion("US")).toBe(false);
      expect(isValidRegion("ap")).toBe(false);
    });
  });

  describe("getBaseUrlForRegion", () => {
    it("should return correct URL for US region", () => {
      expect(getBaseUrlForRegion("us")).toBe("https://app.ninjarmm.com");
    });

    it("should return correct URL for EU region", () => {
      expect(getBaseUrlForRegion("eu")).toBe("https://eu.ninjarmm.com");
    });

    it("should return correct URL for OC region", () => {
      expect(getBaseUrlForRegion("oc")).toBe("https://oc.ninjarmm.com");
    });
  });
});
