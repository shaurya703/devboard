import http from "http";
import { createApp } from "./app";
import { env } from "./config/env";
import { prisma } from "./lib/prisma";

async function bootstrap() {
  const app = createApp();
  const server = http.createServer(app);

  // Socket.IO is attached here in Step 5.

  server.listen(env.SERVER_PORT, () => {
    console.log(`🚀 DevBoard API listening on :${env.SERVER_PORT}`);
  });

  const shutdown = async (signal: string) => {
    console.log(`\n${signal} received, shutting down…`);
    server.close();
    await prisma.$disconnect();
    process.exit(0);
  };
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

bootstrap().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
