import { AuthenticatedUser, PublicUser, UserType } from "../../types/user.types.ts";
import { AuthRepository } from "./auth.repository.ts";
import { CreateUserType, LoginUserType } from "./auth.schema.ts";
import { ProblemDocument } from "../../models/error.model.ts";
import bcrypt from "bcryptjs";
import {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  TokenPayload,
  verifyAccessToken,
  verifyRefreshToken,
} from "../../utils/token.utils.ts";
import { redis } from "../../config/redis.ts";

interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

export class AuthService {
  constructor(private repository: AuthRepository) {}

  async registerUser(data: CreateUserType): Promise<UserType> {
    const existingUserEmail = await this.repository.findByEmail(data.email);
    if (existingUserEmail) {
      throw new ProblemDocument(
        409,
        "User Already Exists",
        "A user with this email is already registered",
      );
    }
    const existingUsername = await this.repository.findByUsername(data.username);
    if (existingUsername) {
      throw new ProblemDocument(
        409,
        "User Already Exists",
        "A user with this username is already registered",
      );
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const { password, ...userDataWithoutPassword } = data;

    const newUser = await this.repository.create({
      ...userDataWithoutPassword,
      password_hash: passwordHash,
    });

    const { password_hash, ...publicUser } = newUser;
    return publicUser as UserType;
  }

  async loginUser(data: LoginUserType): Promise<AuthTokens & { user: PublicUser }> {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isEmail = emailRegex.test(data.identifier);
    const user = isEmail
      ? await this.repository.findByEmail(data.identifier)
      : await this.repository.findByUsername(data.identifier);

    if (!user) {
      throw new ProblemDocument(401, "Invalid Credentials", "Invalid email/username or password");
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password_hash);
    if (!isPasswordValid) {
      throw new ProblemDocument(401, "Invalid Credentials", "Invalid email/username or password");
    }

    const accessToken = generateAccessToken(user.id, user.role);
    const refreshToken = generateRefreshToken(user.id, user.role);
    const refreshTokenHash = hashToken(refreshToken);

    await this.repository.createRefreshToken(user.id, refreshTokenHash);
    const { password_hash, bio, role, created_at, updated_at, is_verified, ...publicUser } = user;
    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: publicUser as PublicUser,
    };
  }

  async refreshTokens(
    rawRefreshToken: string,
  ): Promise<{ access_token: string; refresh_token: string }> {
    let payload: TokenPayload;
    try {
      payload = verifyRefreshToken(rawRefreshToken);
    } catch {
      throw new ProblemDocument(401, "Invalid Token", "Refresh token is invalid or expired");
    }

    const tokenHash = hashToken(rawRefreshToken);
    const storedToken = await this.repository.findRefreshToken(tokenHash);

    if (!storedToken) {
      const revokedToken = await this.repository.findRevokedToken(tokenHash);
      if (revokedToken) {
        await this.repository.revokeAllUserRefreshTokens(revokedToken.user_id);
        throw new ProblemDocument(
          401,
          "Token Reuse Detected",
          "Suspicious activity detected. All sessions have been terminated.",
        );
      }
      throw new ProblemDocument(401, "Invalid Token", "Refresh token is invalid or revoked");
    }

    if (storedToken.expires_at < new Date()) {
      throw new ProblemDocument(401, "Invalid Token", "Refresh token has expired");
    }

    await this.repository.revokeRefreshToken(tokenHash);
    const newAccessToken = generateAccessToken(payload.sub, payload.role);
    const newRefreshToken = generateRefreshToken(payload.sub, payload.role);
    await this.repository.createRefreshToken(payload.sub, hashToken(newRefreshToken));

    return { access_token: newAccessToken, refresh_token: newRefreshToken };
  }

  async logoutUser(rawRefreshToken: string, rawAccessToken: string): Promise<void> {
    const tokenHash = hashToken(rawRefreshToken);
    const storedToken = await this.repository.findRefreshToken(tokenHash);

    if (!storedToken) {
      throw new ProblemDocument(
        401,
        "Invalid Token",
        "Refresh token is invalid or already revoked",
      );
    }

    let accessPayload: TokenPayload;
    try {
      accessPayload = verifyAccessToken(rawAccessToken);
    } catch {
      throw new ProblemDocument(401, "Invalid Token", "Access token is invalid or expired");
    }

    await this.repository.revokeRefreshToken(tokenHash);

    const now = Math.floor(Date.now() / 1000);
    const ttl = (accessPayload.exp ?? now) - now;

    if (ttl > 0) {
      await redis.set(`blacklist:${accessPayload.jti}`, "1", "EX", ttl);
    }
  }

  async getCurrentUser(userId: number): Promise<AuthenticatedUser> {
    const user = await this.repository.findById(userId);

    if (!user) {
      throw new ProblemDocument(404, "Not Found", "User not found");
    }

    const { password_hash, ...authenticatedUser } = user;
    return authenticatedUser;
  }
}
