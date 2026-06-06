import app from "./app";
import { prisma } from "./config/database";
import { connectRedis } from "./config/redis";
import { logger } from "./config/logger";
import { env } from "./config/env";

const PORT = env.PORT;

async function bootstrap(): Promise<void> {
  try {
    await prisma.$connect();
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

process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  logger.info("SIGTERM received — shutting down gracefully");
  process.exit(0);
});

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled rejection:", reason);
  process.exit(1);
});

bootstrap();
