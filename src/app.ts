import "dotenv/config";
import Fastify from "fastify";
import multipart from "@fastify/multipart";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import cookie from "@fastify/cookie";
import { env } from "./config/env.ts";
import { db } from "./config/db.ts";
import { redis } from "./config/redis.ts";
import { apiRoutes } from "./routes.ts";
import { initStorage } from "./config/storage.ts";

const app = Fastify({
  logger: env.NODE_ENV === "development",
});

await app.register(cors, { origin: true });
await app.register(helmet);
await app.register(cookie, {
  secret: env.COOKIE_SECRET,
});
await app.register(multipart, {
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
});

await app.register(apiRoutes, { prefix: "/api" });

const start = async () => {
  try {
    await redis.connect();
    await db.$connect();
    await initStorage();
    await app.listen({ port: env.PORT, host: "0.0.0.0" });
    console.log(`Server running on port ${env.PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
