import express from "express";
import { requireAuth } from "../shared/middlewares/requireAuth.ts";
import { requireNotBlocked } from "../shared/middlewares/requireNotBlocked.ts";
import { requireAdmin } from "../shared/middlewares/requireAdmin.ts";
import { Validator } from "../shared/middlewares/validator.ts";
import { UpdateUsersRequestSchema, UsersQuerySchema } from "../controllers/types.ts";
import { AdminUsersController } from "../controllers/admin.controllers.ts";

export const adminRouter = express.Router();

adminRouter.get("/",
  requireAuth,
  requireNotBlocked,
  requireAdmin,
  Validator.requestQueryValidate(UsersQuerySchema),
  AdminUsersController.getUsers);
adminRouter.post("/users/block",
  requireAuth,
  requireNotBlocked,
  requireAdmin,
  Validator.requestBodyValidate(UpdateUsersRequestSchema),
  AdminUsersController.block);

adminRouter.post("/users/unblock",
  requireAuth,
  requireNotBlocked,
  requireAdmin,
  Validator.requestBodyValidate(UpdateUsersRequestSchema),
  AdminUsersController.unblock);

adminRouter.post("/users/promote",
  requireAuth,
  requireNotBlocked,
  requireAdmin,
  Validator.requestBodyValidate(UpdateUsersRequestSchema),
  AdminUsersController.promote);

adminRouter.post("/users/demote",
  requireAuth,
  requireNotBlocked,
  requireAdmin,
  Validator.requestBodyValidate(UpdateUsersRequestSchema),
  AdminUsersController.demote);

adminRouter.delete("/users",
  requireAuth,
  requireNotBlocked,
  requireAdmin,
  Validator.requestBodyValidate(UpdateUsersRequestSchema),
  AdminUsersController.remove);