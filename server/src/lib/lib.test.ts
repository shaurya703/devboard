import {
  signAccessToken,
  verifyAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
  newJti,
} from "./jwt";
import { hashPassword, verifyPassword } from "./password";
import { ttlToMs } from "./cookies";

describe("jwt", () => {
  it("round-trips an access token", () => {
    const token = signAccessToken({ sub: "u1", email: "a@b.com" });
    const decoded = verifyAccessToken(token);
    expect(decoded.sub).toBe("u1");
    expect(decoded.email).toBe("a@b.com");
  });

  it("round-trips a refresh token", () => {
    const jti = newJti();
    const token = signRefreshToken({ sub: "u1", jti });
    const decoded = verifyRefreshToken(token);
    expect(decoded.sub).toBe("u1");
    expect(decoded.jti).toBe(jti);
  });

  it("rejects a tampered token", () => {
    const token = signAccessToken({ sub: "u1", email: "a@b.com" });
    expect(() => verifyAccessToken(token + "x")).toThrow();
  });

  it("hashToken is deterministic and not the input", () => {
    const t = "some-token";
    expect(hashToken(t)).toBe(hashToken(t));
    expect(hashToken(t)).not.toBe(t);
  });
});

describe("password", () => {
  it("verifies a correct password and rejects a wrong one", async () => {
    const hash = await hashPassword("password123");
    expect(hash).not.toBe("password123");
    expect(await verifyPassword("password123", hash)).toBe(true);
    expect(await verifyPassword("wrong", hash)).toBe(false);
  });
});

describe("ttlToMs", () => {
  it.each([
    ["15m", 15 * 60_000],
    ["7d", 7 * 86_400_000],
    ["30s", 30_000],
    ["2h", 2 * 3_600_000],
  ])("parses %s", (input, expected) => {
    expect(ttlToMs(input)).toBe(expected);
  });
});
