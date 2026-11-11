import { describe, expect, it, afterEach } from "vitest";
import { allowLocalDemo } from "./auth-cookies";

describe("allowLocalDemo", () => {
  const previous = process.env.VERCEL;

  afterEach(() => {
    if (previous === undefined) delete process.env.VERCEL;
    else process.env.VERCEL = previous;
  });

  it("autorise la démo hors Vercel", () => {
    delete process.env.VERCEL;
    expect(allowLocalDemo()).toBe(true);
  });

  it("refuse la démo ouverte sur Vercel", () => {
    process.env.VERCEL = "1";
    expect(allowLocalDemo()).toBe(false);
  });
});
