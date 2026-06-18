import { UserType } from "../../types/user.types.ts";
import { AuthRepository } from "./auth.repository.ts";
import { CreateUserType } from "./auth.schema.ts";
import { ProblemDocument } from "../../models/error.model.ts";
import bcrypt from "bcryptjs";

export class AuthService {
  constructor(private repository: AuthRepository) {}

  async registerUser(data: CreateUserType): Promise<UserType> {
    const existingUser = await this.repository.findByEmail(data.email);
    if (existingUser) {
      throw new ProblemDocument(
        409,
        "User Already Exists",
        "A user with this email is already registered",
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
}
