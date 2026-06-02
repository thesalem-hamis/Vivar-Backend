import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { rateLimiter } from "../src/middleware/rateLimiter";
import { errorHandler } from "../src/middleware/errorHandler";
import { notFound } from "../src/middleware/notFound";
import { requestLogger } from "../src/middleware/requestLogger";

const app: Application = express();

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(morgan("combined"));
app.use(requestLogger);
app.use(rateLimiter);

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

const API = "/api/v1";

app.use(notFound);
app.use(errorHandler);

export default app;
