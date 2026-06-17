import { UserType } from "../../types/user.types.ts";
import { AuthRepository } from "./auth.repository.ts";
import { CreateUserType } from "./auth.schema.ts";
import bcrypt from "bcryptjs";

export class AuthService {
  constructor(private repository: AuthRepository) {}

  async registerUser(data: CreateUserType): Promise<UserType | null> {
    const existingUser = await this.repository.findByEmail(data.email);
    if (existingUser) {
      return null;
    }
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(data.password, saltRounds);

    const { password, ...userDataWithoutPassword } = data;

    const newUser = await this.repository.create({
      ...userDataWithoutPassword,
      password_hash: passwordHash,
    });

    return newUser ? newUser : null;
  }
}
