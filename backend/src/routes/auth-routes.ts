import { Router } from "express";
import { loginHandler, signupHandler, forgotPasswordHandler, resetPasswordHandler, refreshHandler, logoutHandler } from "../controllers/auth-controller.js";
import { authGuard } from "../middleware/auth-middleware.js";

export const authRouter = Router();

authRouter.post("/auth/login", loginHandler);
authRouter.post("/auth/signup", signupHandler);
authRouter.post("/auth/forgot-password", forgotPasswordHandler);
authRouter.post("/auth/reset-password", resetPasswordHandler);
authRouter.post("/auth/refresh", refreshHandler);
authRouter.post("/auth/logout", authGuard, logoutHandler);
