import jwt, { SignOptions } from "jsonwebtoken";
import { ENV } from "./env";

export interface JwtPayload {
  userId: number;
  username: string;
}

/**
 * Sign a JWT token for authenticated user
 */
export const signToken = (userId: number, username: string): string => {
  const options: SignOptions = {
    expiresIn: ENV.JWT_EXPIRES_IN as any,
  };
  return jwt.sign(
    { userId, username } as JwtPayload,
    ENV.JWT_SECRET,
    options
  );
};

/**
 * Verify and decode a JWT token
 * @throws Error if token is invalid or expired
 */
export const verifyToken = (token: string): JwtPayload => {
  try {
    const decoded = jwt.verify(token, ENV.JWT_SECRET) as JwtPayload;
    return decoded;
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      throw new Error("Token telah kedaluwarsa. Silakan login kembali.");
    }
    if (error.name === "JsonWebTokenError") {
      throw new Error("Token tidak valid. Akses ditolak.");
    }
    throw new Error("Gagal memverifikasi token autentikasi.");
  }
};
