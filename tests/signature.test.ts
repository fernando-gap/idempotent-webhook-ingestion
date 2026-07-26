import { describe, expect, it, vi } from "vitest";
import {
  compareSignatures,
  createProviders,
  createSecret,
  createSignature,
  verifySignature,
} from "../src/signature";
import env from "../src/env";
import { WebhookSignatureData } from "../src/types.js";

vi.mock(import("../src/env.js"), () => ({
  default: {
    KELP_PORT: 8080,
    KELP_RANDOM_BYTES_SIZE: 32,
    KELP_PROVIDER_AMOUNT: 5,
    KELP_SECRET_PREFIX: "whsec_",
  },
}));

describe("createSecret", async () => {
  it("returns a secret prefixed with env.KELP_SECRET_PREFIX", () => {
    vi.mocked(env).KELP_SECRET_PREFIX = "whsec_";

    const secret = createSecret();

    expect(
      env.KELP_SECRET_PREFIX.endsWith("_"),
      "The KELP_SECRET_PREFIX must end in an _",
    ).toBe(true);
    expect(secret.startsWith(env.KELP_SECRET_PREFIX)).toBe(true);
  });

  describe("returns a secret between 24 and 64 bytes inclusive", () => {
    const minBytesLength = 32;
    const maxBytesLength = 88;

    it("returns env.KELP_RANDOM_BYTES_SIZE secret when within the range", () => {
      vi.mocked(env).KELP_SECRET_PREFIX = "";

      for (let i = 24; i < 65; i++) {
        vi.mocked(env).KELP_RANDOM_BYTES_SIZE = i;
        const secret = createSecret();
        expect(secret.length).toBeGreaterThanOrEqual(minBytesLength);
        expect(secret.length).toBeLessThanOrEqual(maxBytesLength);
      }
    });

    it("returns 64-bytes secret when env.KELP_SECRET_PREFIX is bigger than 64", () => {
      vi.mocked(env).KELP_RANDOM_BYTES_SIZE = 100;
      vi.mocked(env).KELP_SECRET_PREFIX = "";
      const secret = createSecret();
      expect(secret.length).toBe(maxBytesLength);
    });

    it("returns 24-bytes secret when env.KELP_SECRET_PREFIX is less than than 24", () => {
      vi.mocked(env).KELP_RANDOM_BYTES_SIZE = 12;
      vi.mocked(env).KELP_SECRET_PREFIX = "";
      const secret = createSecret();
      expect(secret.length).toBe(minBytesLength);
    });
  });
});

describe("createSignature", async () => {
  it("returns the expected Base64 HMAC-SHA256 signature", () => {
    vi.mocked(env).KELP_SECRET_PREFIX = "whsec_";
    const expectedSignature = "ydnc64SncH19cxaSCIP53tSrpf7qOJXuLJTGFt2fiXA=";

    const secret = "whsec_ITirpiST4snSMSPuF5bnpztjnW1wDjY4VrnitpGcECA=";
    const data: WebhookSignatureData = {
      id: "msg_35e8a3d9-2dc5-4460-bce9-81349fefb740",
      data: {
        type: "event.sent",
        timestamp: "2026-07-26T14:30:00.000Z", // ISO 8601
        data: {
          hello: "world",
        },
      },
      timestamp: "1674087231", // unix timestamp since epoch
    };

    const signature = createSignature(secret, data);

    expect(signature).toMatch(expectedSignature);
  });
});

describe("createProviders", async () => {
  it("returns exact amount of providers when `amount` is between 1 and 26", () => {
    for (let i = 1; i < 27; i++) {
      const providers = createProviders(i);

      for (const [key, provider] of Object.entries(providers)) {
        expect(key).toMatch(/^[a-z]$/);
        expect(provider).toHaveLength(1);
      }
    }
  });

  it("returns 26 providers when `amount` argument is greater than 26", () => {
    const providers = createProviders(100);
    expect(Object.keys(providers)).toHaveLength(26);
  });

  it("returns at least one provider when `amount` is less or equal than 0", () => {
    const providers = createProviders(-100);
    expect(Object.keys(providers)).toHaveLength(1);
  });
});

describe("compareSignatures", async () => {
  it("returns false when signatures are different", () => {
    const signatureA = "ydnc64SncH19cxaSCIP53tSrpf7qOJXuLJTGFt2fiXA=";
    const signatureB = "hP+toWa4ULbyjVB5AxAgFHvaJM863OtpwKGdOAaxKOo=";

    const comparison = compareSignatures(signatureA, signatureB);

    expect(comparison).toBe(false);
  });

  it("returns false when either signatures have different sizes", () => {
    const signatureA = "ydnc64SncH19cxaSCIP53tSrpf7qOJXuLJTGFt2fiXA=";
    const signatureB = "hP+toWa4ULbyjVB5AxAg=";

    const comparison = compareSignatures(signatureA, signatureB);

    expect(comparison).toBe(false);
  });

  it("returns true when signatures are equal", () => {
    const signatureA = "ydnc64SncH19cxaSCIP53tSrpf7qOJXuLJTGFt2fiXA=";
    const signatureB = "ydnc64SncH19cxaSCIP53tSrpf7qOJXuLJTGFt2fiXA=";

    const comparison = compareSignatures(signatureA, signatureB);

    expect(comparison).toBe(true);
  });
});

describe("verifySignature", async () => {
  const data: WebhookSignatureData = {
    id: "msg_35e8a3d9-2dc5-4460-bce9-81349fefb740",
    data: {
      type: "event.sent",
      timestamp: "2026-07-26T14:30:00.000Z", // ISO 8601
      data: {
        hello: "world",
      },
    },
    timestamp: "1674087231", // unix timestamp since epoch
  };

  it("returns true when at least one verified provider signatures are true", () => {
    const providerSignature =
      "v1,hP+toWa4ULbyjVB5AxAgFHvaJM863OtpwKGdOAaxKOo= v1,ydnc64SncH19cxaSCIP53tSrpf7qOJXuLJTGFt2fiXA=";
    const secrets = [
      "whsec_O4BPiUPotPzQBa1moMvr2fcd1/YlCf/J2S1bp3WtBVU=",
      "whsec_ITirpiST4snSMSPuF5bnpztjnW1wDjY4VrnitpGcECA=",
    ];
    const isValid = verifySignature(data, providerSignature, secrets);

    expect(isValid).toBe(true);
  });

  it("returns false when all provider signatures are invalid", () => {
    const providerSignature =
      "v1,hP+toWa4ULbyjVB5AxAgFHvaJM863OtpwKGdOAaxKOo= v1,ydnc64SncH19cxaSCIP53tSrpf7qOJXuLJTGFt2fiXb=";
    const secrets = [
      "whsec_O4BPiUPotPzQBa1moMvr2fcd1/YlCf/J2S1bp3WtBVU=",
      "whsec_ITirpiST4snSMSPuF5bnpztjnW1wDjY4VrnitpGcECA=",
    ];
    const isValid = verifySignature(data, providerSignature, secrets);

    expect(isValid).toBe(false);
  });

  it("returns false when a provider has 0 signatures", () => {
    const providerSignature =
      "v1,hP+toWa4ULbyjVB5AxAgFHvaJM863OtpwKGdOAaxKOo= v1,ydnc64SncH19cxaSCIP53tSrpf7qOJXuLJTGFt2fiXb=";
    const secrets: string[] = [];
    const isValid = verifySignature(data, providerSignature, secrets);

    expect(isValid).toBe(false);
  });
});
