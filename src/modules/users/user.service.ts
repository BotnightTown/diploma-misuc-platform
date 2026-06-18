import bcrypt from "bcryptjs";
import { UserType } from "../../types/user.types.ts";
import { UserRepository } from "./user.repository.ts";
import {
  ChangeEmailType,
  ChangePasswordType,
  UpdateUsernameType,
  UpdateBioType,
} from "./user.schema.ts";
import { ProblemDocument } from "../../models/error.model.ts";

export class UserService {
  constructor(private repository: UserRepository) {}

  async getUserInfo(userId: number): Promise<UserType | null> {
    const user = await this.repository.findById(userId);
    if (!user) {
      throw new ProblemDocument(
        404,
        "User Not Found",
        `User with ID ${userId} does not exist`,
      );
    }
    const { password_hash, ...publicUser } = user;
    return publicUser ? (publicUser as UserType) : null;
  }

  async updateUsername(
    userId: number,
    data: UpdateUsernameType,
  ): Promise<UserType | null> {
    const userExists = await this.repository.findById(userId);
    if (!userExists) {
      throw new ProblemDocument(
        404,
        "User Not Found",
        `User with ID ${userId} does not exist`,
      );
    }
    const existingUsername = await this.repository.findByUsername(
      data.username,
    );
    if (existingUsername) {
      throw new ProblemDocument(
        409,
        "Username Already Exists",
        "This username is already taken",
      );
    }

    const updatedUsername = await this.repository.update(userId, data);

    return updatedUsername ? (updatedUsername as UserType) : null;
  }

  async updateBio(userId: number, bio: Pick<UpdateBioType, "bio">) {
    return this.repository.update(userId, bio);
  }

  async changeEmail(
    userId: number,
    data: ChangeEmailType,
  ): Promise<UserType | null> {
    const existingEmail = await this.repository.findByEmail(data.new_email);
    if (existingEmail) {
      throw new ProblemDocument(
        409,
        "Email Conflict",
        "This email is already taken",
      );
    }

    const user = await this.repository.findById(userId);
    if (!user) {
      throw new ProblemDocument(
        404,
        "User Not Found",
        "User with the given ID does not exist",
      );
    }

    const isPasswordValid = await bcrypt.compare(
      data.password,
      user.password_hash,
    );
    if (!isPasswordValid) {
      throw new ProblemDocument(
        401,
        "Invalid Password",
        "The provided password is incorrect",
      );
    }

    const changedEmail = await this.repository.update(userId, {
      email: data.new_email,
    });

    return changedEmail ? (changedEmail as UserType) : null;
  }

  async changePassword(
    userId: number,
    data: ChangePasswordType,
  ): Promise<void> {
    const user = await this.repository.findById(userId);
    if (!user) {
      throw new ProblemDocument(
        404,
        "User Not Found",
        "User with the given ID does not exist",
      );
    }

    if (data.old_password === data.new_password) {
      throw new ProblemDocument(
        400,
        "Bad Request",
        "New password cannot be the same as the old password",
      );
    }

    const isPasswordMatch = await bcrypt.compare(
      data.old_password,
      user.password_hash,
    );
    if (!isPasswordMatch) {
      throw new ProblemDocument(
        401,
        "Invalid Password",
        "The provided password is incorrect",
      );
    }

    const passwordHash = await bcrypt.hash(data.new_password, 10);
    await this.repository.update(userId, { password_hash: passwordHash });
  }

  async deleteUser(userId: number): Promise<void> {
    const user = await this.repository.findById(userId);
    if (!user) {
      throw new ProblemDocument(
        404,
        "User Not Found",
        `User with ID ${userId} does not exist`,
      );
    }

    await this.repository.delete(userId);
  }
}
