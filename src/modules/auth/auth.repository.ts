import { db } from "../../config/db.ts";
import { Prisma } from "../../generated/prisma/client.ts";
import { UserType } from "../../types/user.types.ts";

export class AuthRepository {
  async findMany(filters: any): Promise<UserType[]> {
    return db.users.findMany({
      skip: filters.offset,
      take: filters.limit,
    });
  }

  async findById(id: number): Promise<UserType | null> {
    return db.users.findUnique({ where: { id } });
  }

  async findByEmail(email: string): Promise<UserType | null> {
    return db.users.findUnique({ where: { email } });
  }

  async create(data: Prisma.usersCreateInput): Promise<UserType> {
    return db.users.create({
      data,
    });
  }
}
