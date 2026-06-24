import { db } from "../../config/db.ts";
import { UserType } from "../../types/user.types.ts";
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
}
