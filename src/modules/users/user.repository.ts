import { db } from "../../config/db.ts";
import {
  PaginatedResult,
  PaginationParams,
  PUBLIC_USER_SELECT,
  PublicUser,
  UserType,
} from "../../types/user.types.ts";
import { UpdateUsernameType, UpdateBioType } from "./user.schema.ts";

type UpdatePayload = Partial<
  (UpdateUsernameType | UpdateBioType) & {
    email: string;
    avatar_url: string;
    password_hash: string;
  }
>;

export class UserRepository {
  async findById(id: number): Promise<UserType | null> {
    return db.users.findUnique({ where: { id } });
  }

  async findByEmail(email: string): Promise<UserType | null> {
    return db.users.findUnique({ where: { email } });
  }

  async findByUsername(username: string): Promise<UserType | null> {
    return db.users.findUnique({ where: { username } });
  }

  async update(id: number, data: UpdatePayload): Promise<UserType> {
    return db.users.update({ where: { id }, data });
  }

  async delete(id: number): Promise<void> {
    await db.users.delete({ where: { id } });
  }

  async findFollowers(
    id: number,
    { page, limit }: PaginationParams,
  ): Promise<PaginatedResult<PublicUser>> {
    const where = {
      user_follows_user_follows_follower_idTousers: {
        some: { following_id: id },
      },
    };

    const [data, total] = await Promise.all([
      db.users.findMany({
        where,
        select: PUBLIC_USER_SELECT,
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.users.count({ where }),
    ]);

    return { data, total };
  }

  async findFollowing(
    id: number,
    { page, limit }: PaginationParams,
  ): Promise<PaginatedResult<PublicUser>> {
    const where = {
      user_follows_user_follows_following_idTousers: {
        some: { follower_id: id },
      },
    };

    const [data, total] = await Promise.all([
      db.users.findMany({
        where,
        select: PUBLIC_USER_SELECT,
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.users.count({ where }),
    ]);

    return { data, total };
  }

  async createFollow(followerId: number, followingId: number): Promise<void> {
    await db.user_follows.create({
      data: {
        follower_id: followerId,
        following_id: followingId,
      },
    });
  }

  async deleteFollow(followerId: number, followingId: number): Promise<number> {
    const result = await db.user_follows.deleteMany({
      where: {
        follower_id: followerId,
        following_id: followingId,
      },
    });

    return result.count;
  }
}
