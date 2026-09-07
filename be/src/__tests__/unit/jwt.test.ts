import { signToken, verifyToken } from "../../config/jwt";

describe("JWT — Token Signing & Verification", () => {
  it("should sign a valid JWT token", () => {
    const token = signToken(1, "testuser");
    expect(token).toBeTruthy();
    expect(typeof token).toBe("string");
    expect(token.split(".")).toHaveLength(3); // JWT has 3 parts
  });

  it("should verify a valid token and return payload", () => {
    const token = signToken(42, "adam");
    const decoded = verifyToken(token);
    expect(decoded.userId).toBe(42);
    expect(decoded.username).toBe("adam");
  });

  it("should throw error for invalid token", () => {
    expect(() => verifyToken("invalid.token.string")).toThrow();
  });

  it("should throw error for tampered token", () => {
    const token = signToken(1, "user");
    const tampered = token.slice(0, -5) + "XXXXX";
    expect(() => verifyToken(tampered)).toThrow();
  });

  it("should encode different users as different tokens", () => {
    const token1 = signToken(1, "alice");
    const token2 = signToken(2, "bob");
    expect(token1).not.toBe(token2);
  });
});
