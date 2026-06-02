import Bull from "bull";
import { env } from "../config/env";

const redisConfig = {
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD || undefined,
};

export const emailQueue = new Bull("email", { redis: redisConfig });

export const imageQueue = new Bull("image", { redis: redisConfig });

emailQueue.process(async (job) => {
  const { type, ...data } = job.data;
  console.log(`[emailQueue] Processing job type=${type}`, data);
});

imageQueue.process(async (job) => {
  const { inputPath, outputPath, width, height } = job.data;
  console.log(`[imageQueue] Resizing ${inputPath} → ${outputPath}`);
});

emailQueue.on("failed", (job, err) => {
  console.error(`[emailQueue] Job ${job.id} failed:`, err.message);
});

imageQueue.on("failed", (job, err) => {
  console.error(`[imageQueue] Job ${job.id} failed:`, err.message);
});
