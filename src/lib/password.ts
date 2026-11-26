import crypto from "crypto";

/**
 * Password Hashing chuẩn NIST (PBKDF2-SHA512, 100,000 iterations, 16-byte random salt).
 * Được dùng chung giữa Better Auth credential provider và tầng quản trị người dùng.
 * Tuyệt đối không chấp nhận so sánh mật khẩu plaintext.
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const iterations = 100000;
  const derivedKey = crypto
    .pbkdf2Sync(password, salt, iterations, 64, "sha512")
    .toString("hex");
  return `pbkdf2$${iterations}$${salt}$${derivedKey}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  if (!password || !storedHash) return false;

  if (storedHash.startsWith("pbkdf2$")) {
    const parts = storedHash.split("$");
    if (parts.length !== 4) return false;
    const iterations = parseInt(parts[1], 10);
    const salt = parts[2];
    const originalHash = parts[3];

    if (!Number.isFinite(iterations) || iterations < 10000 || !salt || !originalHash) {
      return false;
    }

    const derivedKey = crypto
      .pbkdf2Sync(password, salt, iterations, 64, "sha512")
      .toString("hex");

    const keyBuf = Buffer.from(derivedKey, "hex");
    const origBuf = Buffer.from(originalHash, "hex");

    if (keyBuf.length !== origBuf.length) return false;
    return crypto.timingSafeEqual(keyBuf, origBuf);
  }

  // Zero plaintext fallback
  return false;
}
