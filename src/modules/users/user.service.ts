import bcrypt from "bcryptjs";
import { UserAvatarUploadData, UserType } from "../../types/user.types.ts";
import { UserRepository } from "./user.repository.ts";
import {
  ChangeEmailType,
  ChangePasswordType,
  UpdateUsernameType,
  UpdateBioType,
} from "./user.schema.ts";
import { ProblemDocument } from "../../models/error.model.ts";
import {
  deleteFile,
  extractKeyFromUrl,
  generateStorageKey,
  IMAGE_FOLDERS,
  uploadFile,
  validateFile,
} from "../../utils/storage.utils.ts";

const DEFAULT_USER_AVATAR = "default_avatar.png";

const PRISMA_UNIQUE_CONSTRAINT_CODE = "P2002";

function isUniqueConstraintError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: unknown }).code === PRISMA_UNIQUE_CONSTRAINT_CODE
  );
}

export class UserService {
  constructor(private repository: UserRepository) {}

  async getUserInfo(userId: number): Promise<UserType | null> {
    const user = await this.repository.findById(userId);
    if (!user) {
      throw new ProblemDocument(404, "User Not Found", `User with ID ${userId} does not exist`);
    }
    const { password_hash, ...publicUser } = user;
    return publicUser ? (publicUser as UserType) : null;
  }

  async updateUsername(userId: number, data: UpdateUsernameType): Promise<UserType | null> {
    const userExists = await this.repository.findById(userId);
    if (!userExists) {
      throw new ProblemDocument(404, "User Not Found", `User with ID ${userId} does not exist`);
    }
    const existingUsername = await this.repository.findByUsername(data.username);
    if (existingUsername) {
      throw new ProblemDocument(409, "Username Already Exists", "This username is already taken");
    }

    const updatedUsername = await this.repository.update(userId, data);

    return updatedUsername ? (updatedUsername as UserType) : null;
  }

  async updateBio(userId: number, bio: Pick<UpdateBioType, "bio">) {
    return this.repository.update(userId, bio);
  }

  private async uploadAvatar(data: UserAvatarUploadData): Promise<string> {
    validateFile(data.contentType, data.size, "images");

    const key = generateStorageKey(data.filename, IMAGE_FOLDERS.userAvatars);
    return uploadFile({
      bucket: "images",
      key,
      body: data.file,
      contentType: data.contentType,
      size: data.size,
    });
  }

  async updateAvatar(userId: number, data: UserAvatarUploadData | null): Promise<UserType> {
    const currentUser = await this.repository.findById(userId);
    if (!currentUser) {
      throw new ProblemDocument(404, "User Not Found", `User with ID ${userId} does not exist`);
    }

    const avatarUrl = data ? await this.uploadAvatar(data) : DEFAULT_USER_AVATAR;
    const updatedUser = await this.repository.update(userId, { avatar_url: avatarUrl });

    const oldKey = extractKeyFromUrl(currentUser.avatar_url, "images");
    if (oldKey) {
      await deleteFile("images", oldKey);
    }

    return updatedUser;
  }

  async changeEmail(userId: number, data: ChangeEmailType): Promise<UserType | null> {
    const existingEmail = await this.repository.findByEmail(data.new_email);
    if (existingEmail) {
      throw new ProblemDocument(409, "Email Conflict", "This email is already taken");
    }

    const user = await this.repository.findById(userId);
    if (!user) {
      throw new ProblemDocument(404, "User Not Found", "User with the given ID does not exist");
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password_hash);
    if (!isPasswordValid) {
      throw new ProblemDocument(401, "Invalid Password", "The provided password is incorrect");
    }

    const changedEmail = await this.repository.update(userId, {
      email: data.new_email,
    });

    return changedEmail ? (changedEmail as UserType) : null;
  }

  async changePassword(userId: number, data: ChangePasswordType): Promise<void> {
    const user = await this.repository.findById(userId);
    if (!user) {
      throw new ProblemDocument(404, "User Not Found", "User with the given ID does not exist");
    }

    if (data.old_password === data.new_password) {
      throw new ProblemDocument(
        400,
        "Bad Request",
        "New password cannot be the same as the old password",
      );
    }

    const isPasswordMatch = await bcrypt.compare(data.old_password, user.password_hash);
    if (!isPasswordMatch) {
      throw new ProblemDocument(401, "Invalid Password", "The provided password is incorrect");
    }

    const passwordHash = await bcrypt.hash(data.new_password, 10);
    await this.repository.update(userId, { password_hash: passwordHash });
  }

  async deleteUser(userId: number): Promise<void> {
    const user = await this.repository.findById(userId);
    if (!user) {
      throw new ProblemDocument(404, "User Not Found", `User with ID ${userId} does not exist`);
    }

    await this.repository.delete(userId);
  }

  async getFollowers(userId: number): Promise<UserType[]> {
    const user = await this.repository.findById(userId);
    if (!user) {
      throw new ProblemDocument(404, "User Not Found", `User with ID ${userId} does not exist`);
    }

    return this.repository.findFollowers(userId);
  }

  async getFollowing(userId: number): Promise<UserType[]> {
    const user = await this.repository.findById(userId);
    if (!user) {
      throw new ProblemDocument(404, "User Not Found", `User with ID ${userId} does not exist`);
    }

    return this.repository.findFollowing(userId);
  }

  async followUser(followerId: number, followingId: number): Promise<void> {
    if (followerId === followingId) {
      throw new ProblemDocument(400, "Bad Request", "Users cannot follow themselves");
    }

    const [follower, following] = await Promise.all([
      this.repository.findById(followerId),
      this.repository.findById(followingId),
    ]);

    if (!follower || !following) {
      throw new ProblemDocument(404, "User Not Found", "One or both users do not exist");
    }

    try {
      await this.repository.createFollow(followerId, followingId);
    } catch (err) {
      if (isUniqueConstraintError(err)) {
        throw new ProblemDocument(409, "Conflict", "You are already following this user");
      }
      throw err;
    }
  }

  async unfollowUser(followerId: number, followingId: number): Promise<void> {
    const [follower, following] = await Promise.all([
      this.repository.findById(followerId),
      this.repository.findById(followingId),
    ]);

    if (!follower || !following) {
      throw new ProblemDocument(404, "User Not Found", "One or both users do not exist");
    }

    const deletedCount = await this.repository.deleteFollow(followerId, followingId);
    if (!deletedCount) {
      throw new ProblemDocument(409, "Conflict", "You are not following this user");
    }
  }
}
