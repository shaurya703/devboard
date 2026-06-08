import express, { Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { allowedOrigins } from "./config/env";
import api from "./routes";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";

/**
 * Build the Express app without binding a port. Importing this (rather than
 * index.ts) lets tests drive the app via Supertest with no open socket.
 */
export function createApp(): Express {
  const app = express();

  app.use(
    cors({
      origin: allowedOrigins,
      credentials: true, // allow the refresh-token cookie
    })
  );
  app.use(express.json());
  app.use(cookieParser());

  app.use("/api", api);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
