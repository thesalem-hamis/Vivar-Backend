import express, { Request, Response } from "express";

const app = express();

app.get("/", (_req: Request, res: Response) => {
  res.json({ message: "Welcome to Vivar Realty Server" });
});

export default app;
