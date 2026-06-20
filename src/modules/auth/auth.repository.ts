import { db } from "../../config/db.ts";
import { Prisma } from "../../generated/prisma/client.ts";
import { UserType } from "../../types/user.types.ts";

export class AuthRepository {
  async findById(id: number): Promise<UserType | null> {
    return db.users.findUnique({ where: { id } });
  }

  async findByEmail(email: string): Promise<UserType | null> {
    return db.users.findUnique({ where: { email } });
  }

  async findByUsername(username: string): Promise<UserType | null> {
    return db.users.findUnique({ where: { username } });
  }

  async create(data: Prisma.usersCreateInput): Promise<UserType> {
    return db.users.create({
      data,
    });
  }

  async createRefreshToken(userId: number, tokenHash: string): Promise<void> {
    await db.refresh_tokens.create({
      data: { user_id: userId, token_hash: tokenHash },
    });
  }

  async findRefreshToken(tokenHash: string) {
    return db.refresh_tokens.findFirst({
      where: { token_hash: tokenHash, revoked_at: null },
    });
  }

  async revokeRefreshToken(tokenHash: string): Promise<void> {
    await db.refresh_tokens.updateMany({
      where: { token_hash: tokenHash },
      data: { revoked_at: new Date() },
    });
  }

  async revokeAllUserRefreshTokens(userId: number): Promise<void> {
    await db.refresh_tokens.updateMany({
      where: { user_id: userId, revoked_at: null },
      data: { revoked_at: new Date() },
    });
  }
}
