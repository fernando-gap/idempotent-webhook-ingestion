/**
 * Converts a string to a number.
 *
 * @param str - the string to be converted
 * @returns the string converted to a number
 *
 * @throws {@link Error}
 * When string could not be converted to a number
 */
export function readNumber(str: string): number {
  if (Number.isInteger(Number(str))) return Number(str);
  throw new Error("Environment variable is not an integer");
}

/**
 * Parse and validates webhook prefix
 *
 * @remarks
 * The webhook prefix is configured by `KELP_SECRET_PREFIX` environment
 * variable, and is expected to have a trailing underscore
 *
 * @param prefix - the webhook prefix
 * @returns the prefix
 *
 * @throws {@link Error}
 * When a trailing underscore is missing
 */
export function parsePrefix(prefix: string) {
  if (prefix.endsWith("_")) return prefix;
  throw new Error("Prefix underscore is missing");
}

/**
 * Export validated environment variables.
 * Import this file to use the environment variables with their
 * expected types and validation
 *
 * @remarks
 * Environment variables are read as strings, but part of the code
 * requires some specific type or constraint necessary to avoid having
 * the need to handle the validation every time it is used.
 */
const env = Object.freeze({
  ...process.env,
  KELP_PORT: readNumber(process.env.KELP_PORT),
  KELP_RANDOM_BYTES_SIZE: readNumber(process.env.KELP_RANDOM_BYTES_SIZE),
  KELP_PROVIDER_AMOUNT: readNumber(process.env.KELP_PROVIDER_NUMBER),
  KELP_SECRET_PREFIX: parsePrefix(process.env.KELP_SECRET_PREFIX),
});

export default env;
