import { Router } from "express";
import {
  banUserHandler,
  createUserHandler,
  getUserPermissionsHandler,
  listUsersHandler,
  reactivateUserHandler,
  suspendUserHandler,
  updateUserHandler,
  updateUserPermissionsHandler,
} from "../controllers/user-controller.js";
import { authGuard } from "../middleware/auth-middleware.js";
import { permissionGuard } from "../middleware/permission-middleware.js";

export const userRouter = Router();

userRouter.use(authGuard);

userRouter.get("/users", permissionGuard("users.view"), listUsersHandler);
userRouter.post("/users", permissionGuard("users.create"), createUserHandler);
userRouter.patch("/users/:id", permissionGuard("users.edit"), updateUserHandler);
userRouter.post("/users/:id/suspend", permissionGuard("users.suspend"), suspendUserHandler);
userRouter.post("/users/:id/ban", permissionGuard("users.ban"), banUserHandler);
userRouter.post("/users/:id/reactivate", permissionGuard("users.suspend"), reactivateUserHandler);
userRouter.get("/users/:id/permissions", permissionGuard("permissions.view"), getUserPermissionsHandler);
userRouter.patch("/users/:id/permissions", permissionGuard("permissions.assign"), updateUserPermissionsHandler);
