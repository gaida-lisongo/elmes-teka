import { randomBytes, scrypt as callbackScrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(callbackScrypt);

/**
 * Hash un mot de passe avec scrypt.
 * Format: scrypt$sel$hash
 */
export async function hashPassword(password: string): Promise<string> {
  const normalizedPassword = password.normalize("NFKC");
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scrypt(normalizedPassword, salt, 64)) as Buffer;

  return `scrypt$${salt}$${derivedKey.toString("hex")}`;
}

/**
 * Vérifie un mot de passe contre un hash stocké.
 */
export async function verifyPassword(
  password: string,
  storedPassword: string
): Promise<boolean> {
  try {
    const [algorithm, salt, storedHash] = storedPassword.split("$");

    if (algorithm !== "scrypt" || !salt || !storedHash) {
      return false;
    }

    const storedHashBuffer = Buffer.from(storedHash, "hex");
    const derivedKey = (await scrypt(
      password.normalize("NFKC"),
      salt,
      storedHashBuffer.length
    )) as Buffer;

    return (
      derivedKey.length === storedHashBuffer.length &&
      timingSafeEqual(derivedKey, storedHashBuffer)
    );
  } catch {
    return false;
  }
}