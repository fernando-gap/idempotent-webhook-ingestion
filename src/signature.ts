import { randomBytes, createHmac, timingSafeEqual } from "node:crypto";
import { Providers, WebhookSignatureData } from "./types";
import env from "./env";

/**
 * Creates secret used by providers and signature verification.
 *
 * @remarks
 * The `KELP_SECRET_PREFIX` and `KELP_RANDOM_BYTES_SIZE` determines
 * the prefix and the size of secret, respectively.
 *
 * If `KELP_RANDOM_BYTES_SIZE` is less than 24 or bigger than 64
 * it will be set to 24 and 64 accordingly.
 *
 * @returns A Base64 Webhook secret.
 */
export function createSecret() {
  let size = env.KELP_RANDOM_BYTES_SIZE;

  if (size < 24) {
    size = 24;
  } else if (size > 64) {
    size = 64;
  }

  return `${env.KELP_SECRET_PREFIX}${randomBytes(size).toString("base64")}`;
}

/**
 * Creates a Webhook HMAC-SHA256 signature.
 *
 * @param secret - The Webhook secret
 * @param data - The data to be signed
 * @returns A Base64 HMAC-SHA256 that signed `data` with `secret`.
 */
export function createSignature(secret: string, data: WebhookSignatureData) {
  const encodedSecret = Buffer.from(
    secret.slice(env.KELP_SECRET_PREFIX.length),
    "base64",
  );
  const dataToBeSigned = `${data.id}.${data.timestamp}.${JSON.stringify(data.data)}`;

  return createHmac("sha256", encodedSecret)
    .update(dataToBeSigned)
    .digest("base64");
}

/**
 * Creates an amount of simulated providers.
 *
 * @remarks
 * At least one provider will be created.
 * And every provider has a name and at least one secret.
 * The names for the provides are fixed from a-z.
 * While the maximum number of providers are 27.
 *
 * @param amount - the number of providers to be created.
 * @returns an object with the name and secret of the providers
 */
export function createProviders(amount: number): Providers {
  const providers: Providers = {};
  const names = "abcdefghijklmnopqrstuvwxyz".split("");

  if (amount > names.length) {
    amount = names.length;
  } else if (amount <= 0) {
    amount = 1;
  }

  for (let provider = 0; provider < amount; provider++) {
    const name = names[provider];

    if (typeof name !== "string") {
      throw Error("Provider name is undefined");
    }

    providers[name] = [createSecret()];
  }

  return providers;
}

/**
 * Compares two signatures.
 *
 * @param receivedSignature - The signature received from the request.
 * @param computedSignature - The signature created from the request payload and headers.
 * @returns A boolean value describing whether the signatures matches exactly.
 */
export function compareSignatures(
  receivedSignature: string,
  computedSignature: string,
) {
  const bufA = Buffer.from(receivedSignature);
  const bufB = Buffer.from(computedSignature);

  return bufA.length == bufB.length && timingSafeEqual(bufA, bufB);
}

/**
 * Verifies the signature against the provider's secrets.
 *
 * @remarks
 * A provider can have more than one secret.
 * The first secret that validates the provider's signature will be returned.
 * So a provider with all secrets will be rejected, while a provider with at
 * least one secret valid will be accepted and thus returned true.
 *
 * @param signature - A signature provided by the provider.
 * @returns Whether the provider has at least one secret valid.
 */
export function verifySignature(
  data: WebhookSignatureData,
  signature: string,
  secrets: string[],
): boolean {
  if (secrets.length === 0) return false;

  const signatures = signature.split(" ");
  const prefix = "v1,";

  for (const row of signatures) {
    const webhookSignature = row.slice(prefix.length);

    for (const secret of secrets) {
      if (compareSignatures(webhookSignature, createSignature(secret, data)))
        return true;
    }
  }

  return false;
}
