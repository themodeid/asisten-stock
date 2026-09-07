import { hashPassword, verifyPassword } from "../../modules/auth/auth.service";

describe("Auth Service — Password Hashing", () => {
  it("should hash a password and return salt + hash", () => {
    const result = hashPassword("test_password_123");
    expect(result).toHaveProperty("salt");
    expect(result).toHaveProperty("hash");
    expect(result.salt).toBeTruthy();
    expect(result.hash).toBeTruthy();
    expect(result.salt.length).toBeGreaterThan(10);
    expect(result.hash.length).toBeGreaterThan(10);
  });

  it("should produce deterministic hash with same salt", () => {
    const first = hashPassword("mypassword");
    const second = hashPassword("mypassword", first.salt);
    expect(second.hash).toBe(first.hash);
  });

  it("should produce different hashes for different passwords", () => {
    const salt = "fixed-salt-for-test";
    const hash1 = hashPassword("password1", salt);
    const hash2 = hashPassword("password2", salt);
    expect(hash1.hash).not.toBe(hash2.hash);
  });

  it("should produce different salts for same password without explicit salt", () => {
    const first = hashPassword("samepassword");
    const second = hashPassword("samepassword");
    expect(first.salt).not.toBe(second.salt);
  });
});

describe("Auth Service — Password Verification", () => {
  it("should verify correct password", () => {
    const { salt, hash } = hashPassword("correct_password");
    const isValid = verifyPassword("correct_password", salt, hash);
    expect(isValid).toBe(true);
  });

  it("should reject incorrect password", () => {
    const { salt, hash } = hashPassword("correct_password");
    const isValid = verifyPassword("wrong_password", salt, hash);
    expect(isValid).toBe(false);
  });

  it("should reject empty password", () => {
    const { salt, hash } = hashPassword("some_password");
    const isValid = verifyPassword("", salt, hash);
    expect(isValid).toBe(false);
  });
});
