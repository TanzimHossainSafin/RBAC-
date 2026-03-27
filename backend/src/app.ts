import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { APP_ORIGIN } from "./config.js";
import { errorHandler } from "./middleware/error-middleware.js";
import { authRouter } from "./routes/auth-routes.js";
import { userRouter } from "./routes/user-routes.js";
import { workspaceRouter } from "./routes/workspace-routes.js";

export function createApp() {
  const app = express();

  app.use(cors({ origin: APP_ORIGIN, credentials: true }));
  app.use(express.json());
  app.use(cookieParser());

  app.use(authRouter);
  app.use(workspaceRouter);
  app.use(userRouter);

  app.use(errorHandler);

  return app;
}
