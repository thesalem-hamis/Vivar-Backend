import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { db } from "../../config/database";
import { redisClient } from "../../config/redis";
import { env } from "../../config/env";
import { User, JwtPayload, UserRole } from "../../types";
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
  first_name: string;
  last_name: string;
  phone?: string;
  role?: UserRole;
}

export class AuthService {
  async register(dto: RegisterDto): Promise<AuthTokens> {
    const { rows: existing } = await db.query(
      "SELECT id FROM users WHERE email = $1",
      [dto.email.toLowerCase()],
    );
    if (existing[0]) throw new AppError("Email already in use", 409);

    const password_hash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    const { rows } = await db.query<User>(
      `INSERT INTO users (id, email, password_hash, first_name, last_name, phone, role)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING *`,
      [
        uuidv4(),
        dto.email.toLowerCase(),
        password_hash,
        dto.first_name,
        dto.last_name,
        dto.phone,
        dto.role ?? UserRole.BUYER,
      ],
    );

    return this.issueTokens(rows[0]);
  }

  async login(email: string, password: string): Promise<AuthTokens> {
    const { rows } = await db.query<User>(
      "SELECT * FROM users WHERE email = $1 AND is_active = TRUE",
      [email.toLowerCase()],
    );

    const user = rows[0];

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

    const { rows } = await db.query<User>("SELECT * FROM users WHERE id = $1", [
      payload.sub,
    ]);
    if (!rows[0]) throw new AppError("User not found", 404);

    return this.issueTokens(rows[0]);
  }

  async logout(userId: string): Promise<void> {
    await redisClient.del(`refresh_token:${userId}`);
  }

  private async issueTokens(user: User): Promise<AuthTokens> {
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
