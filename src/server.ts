import "dotenv/config";
import app from "./app";
import { connectDatabase } from "./config/database";
import { connectRedis } from "./config/redis";
import { logger } from "./config/logger";
import { env } from "./config/env";

const PORT = env.PORT;

async function bootstrap(): Promise<void> {
  try {
    await connectDatabase();
    logger.info("✅ PostgreSQL connected");

    await connectRedis();
    logger.info("✅ Redis connected");

    app.listen(PORT, () => {
      logger.info(
        `🚀 Server running on http://localhost:${PORT} [${env.NODE_ENV}]`,
      );
    });
  } catch (error) {
    logger.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

process.on("SIGTERM", () => {
  logger.info("SIGTERM received — shutting down gracefully");
  process.exit(0);
});

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled rejection:", reason);
  process.exit(1);
});

bootstrap();
