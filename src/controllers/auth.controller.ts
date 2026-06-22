import { Request, Response, NextFunction } from "express";
import { authService } from "../services/auth/auth.service";

export class AuthController {
  async register(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const tokens = await authService.register(req.body);
      res.status(201).json({ success: true, data: tokens });
    } catch (err) {
      next(err);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      const { access_token, refresh_token, expires_in } =
        await authService.login(email, password);
      res.cookie("refreshToken", refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });
      res.json({
        success: true,
        data: {
          access_token,
          expires_in,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async getProfile(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const profile = await authService.getProfile(req.user?.sub);
      res.json({ success: true, data: profile });
    } catch (err) {
      next(err);
    }
  }

  async refresh(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { refresh_token } = req.body;
      const tokens = await authService.refresh(refresh_token);
      res.json({ success: true, data: tokens });
    } catch (err) {
      next(err);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await authService.logout(req.user!.sub);
      res.json({ success: true, message: "Logged out successfully" });
    } catch (err) {
      next(err);
    }
  }
}

export const authController = new AuthController();
