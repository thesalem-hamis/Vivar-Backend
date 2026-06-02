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
      const tokens = await authService.login(email, password);
      res.json({ success: true, data: tokens });
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
