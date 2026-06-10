import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../../config/database"; // Import your Prisma singleton
import { redisClient } from "../../config/redis";
import { env } from "../../config/env";
import { JwtPayload, UserRole } from "../../types";
import { AppError } from "../../utils/AppError";

const BCRYPT_ROUNDS = 12;

interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: string;
}

interface RegisterDto {
  email: string;
  password: string;
  name: string;
  code: string;
}

export class AuthService {
  async register(dto: RegisterDto): Promise<AuthTokens> {
    if (dto.code !== env.REGISTRATION_CODE) {
      throw new AppError("Invalid registration code", 403);
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existingUser) throw new AppError("Email already in use", 409);

    const password_hash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        password_hash,
        googleId: "",
        name: dto.name,
      },
    });

    return this.issueTokens(user);
  }

  async login(email: string, password: string): Promise<AuthTokens> {
    const user = await prisma.user.findFirst({
      where: {
        email: email.toLowerCase(),
      },
    });

    const passwordMatch = user
      ? await bcrypt.compare(password, user.password_hash)
      : await bcrypt.compare(password, "$2a$12$invalidhashpadding000000000000");

    if (!user || !passwordMatch) {
      throw new AppError("Invalid email or password", 401);
    }

    return this.issueTokens(user);
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    let payload: JwtPayload;
    try {
      payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as JwtPayload;
    } catch {
      throw new AppError("Invalid or expired refresh token", 401);
    }

    const storedToken = await redisClient.get(`refresh_token:${payload.sub}`);
    if (storedToken !== refreshToken) {
      throw new AppError("Refresh token revoked or reused", 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) throw new AppError("User not found", 404);

    return this.issueTokens(user);
  }

  async logout(userId: string): Promise<void> {
    await redisClient.del(`refresh_token:${userId}`);
  }

  private async issueTokens(user: any): Promise<AuthTokens> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const access_token = jwt.sign(payload, env.JWT_SECRET as jwt.Secret, {
      expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
    });

    const refresh_token = jwt.sign(
      payload,
      env.JWT_REFRESH_SECRET as jwt.Secret,
      {
        expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions["expiresIn"],
      },
    );

    await redisClient.set(`refresh_token:${user.id}`, refresh_token, {
      EX: 30 * 24 * 60 * 60,
    });

    return { access_token, refresh_token, expires_in: env.JWT_EXPIRES_IN };
  }
}

export const authService = new AuthService();
