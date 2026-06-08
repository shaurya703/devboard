import { prismaMock } from "../../test/prismaMock";
import * as authService from "./auth.service";
import { signRefreshToken, hashToken, newJti } from "../../lib/jwt";
import { ApiError } from "../../utils/ApiError";

const fakeUser = {
  id: "user-1",
  email: "alice@devboard.dev",
  name: "Alice",
  passwordHash: "", // filled per test
  createdAt: new Date("2026-01-01T00:00:00Z"),
  updatedAt: new Date("2026-01-01T00:00:00Z"),
};

describe("authService.register", () => {
  it("rejects a duplicate email with 409", async () => {
    prismaMock.user.findUnique.mockResolvedValue(fakeUser);

    await expect(
      authService.register({
        name: "Alice",
        email: "alice@devboard.dev",
        password: "password123",
      })
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it("creates a user and issues tokens", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue(fakeUser);
    prismaMock.refreshToken.create.mockResolvedValue({} as never);

    const result = await authService.register({
      name: "Alice",
      email: "alice@devboard.dev",
      password: "password123",
    });

    expect(result.user.email).toBe("alice@devboard.dev");
    expect(typeof result.accessToken).toBe("string");
    expect(typeof result.refreshToken).toBe("string");
    expect(prismaMock.refreshToken.create).toHaveBeenCalledTimes(1);
    // Stored token must be hashed, never plaintext.
    const stored = prismaMock.refreshToken.create.mock.calls[0][0].data
      .tokenHash as string;
    expect(stored).not.toBe(result.refreshToken);
  });
});

describe("authService.login", () => {
  it("rejects an unknown user with 401 (no enumeration)", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    await expect(
      authService.login({ email: "nope@x.com", password: "password123" })
    ).rejects.toBeInstanceOf(ApiError);
  });

  it("rejects a wrong password with 401", async () => {
    // bcrypt hash of "password123"
    const bcrypt = await import("bcryptjs");
    const passwordHash = await bcrypt.hash("password123", 10);
    prismaMock.user.findUnique.mockResolvedValue({ ...fakeUser, passwordHash });

    await expect(
      authService.login({ email: fakeUser.email, password: "WRONG" })
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  it("logs in with the correct password", async () => {
    const bcrypt = await import("bcryptjs");
    const passwordHash = await bcrypt.hash("password123", 10);
    prismaMock.user.findUnique.mockResolvedValue({ ...fakeUser, passwordHash });
    prismaMock.refreshToken.create.mockResolvedValue({} as never);

    const result = await authService.login({
      email: fakeUser.email,
      password: "password123",
    });
    expect(result.user.id).toBe("user-1");
  });
});

describe("authService.rotateRefreshToken", () => {
  const validToken = () => signRefreshToken({ sub: fakeUser.id, jti: newJti() });

  it("rotates a valid token: revokes old, issues new", async () => {
    const token = validToken();
    prismaMock.refreshToken.findUnique.mockResolvedValue({
      id: "rt-1",
      userId: fakeUser.id,
      tokenHash: hashToken(token),
      revokedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
      createdAt: new Date(),
    });
    prismaMock.user.findUnique.mockResolvedValue(fakeUser);
    prismaMock.refreshToken.update.mockResolvedValue({} as never);
    prismaMock.refreshToken.create.mockResolvedValue({} as never);

    const result = await authService.rotateRefreshToken(token);

    expect(prismaMock.refreshToken.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "rt-1" } })
    );
    expect(result.refreshToken).not.toBe(token);
  });

  it("detects reuse of a revoked token and nukes all sessions", async () => {
    const token = validToken();
    prismaMock.refreshToken.findUnique.mockResolvedValue({
      id: "rt-1",
      userId: fakeUser.id,
      tokenHash: hashToken(token),
      revokedAt: new Date(), // already revoked → replay
      expiresAt: new Date(Date.now() + 60_000),
      createdAt: new Date(),
    });
    prismaMock.refreshToken.updateMany.mockResolvedValue({ count: 3 } as never);

    await expect(authService.rotateRefreshToken(token)).rejects.toMatchObject({
      statusCode: 401,
    });
    expect(prismaMock.refreshToken.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: fakeUser.id, revokedAt: null },
      })
    );
  });

  it("rejects an expired token", async () => {
    const token = validToken();
    prismaMock.refreshToken.findUnique.mockResolvedValue({
      id: "rt-1",
      userId: fakeUser.id,
      tokenHash: hashToken(token),
      revokedAt: null,
      expiresAt: new Date(Date.now() - 1000), // expired
      createdAt: new Date(),
    });

    await expect(authService.rotateRefreshToken(token)).rejects.toMatchObject({
      statusCode: 401,
    });
  });

  it("rejects an unrecognized (not stored) token", async () => {
    const token = validToken();
    prismaMock.refreshToken.findUnique.mockResolvedValue(null);
    await expect(authService.rotateRefreshToken(token)).rejects.toMatchObject({
      statusCode: 401,
    });
  });

  it("rejects a garbage token", async () => {
    await expect(
      authService.rotateRefreshToken("not-a-jwt")
    ).rejects.toBeInstanceOf(ApiError);
  });
});
