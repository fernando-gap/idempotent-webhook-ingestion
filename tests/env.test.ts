import { describe, it, expect } from "vitest";
import { readNumber, parsePrefix } from "../src/env";

describe("readNumber", () => {
  it("returns an integer when `env` is a parseable number", () => {
    expect(readNumber("024")).toEqual(24);
  });
  it("throws an error when `env` is not parsed as a number", () => {
    expect(() => readNumber("gibberish")).toThrow(Error);
  });
});

describe("parsePrefix", () => {
  it("returns `prefix` unchanged when underscore is present", () => {
    expect(parsePrefix("whsec_")).toMatch("whsec_");
  });

  it("throws error when `prefix` does not end with an underscore", () => {
    expect(() => parsePrefix("whsec")).toThrow(Error);
  });
});
