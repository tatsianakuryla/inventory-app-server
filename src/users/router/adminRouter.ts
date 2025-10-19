import express from "express";
import { requireAuthAndNotBlocked } from "../../shared/middlewares/requireAuthAndNotBlocked.ts";
import { requireAdmin } from "../../shared/middlewares/requireAdmin.ts";
import { Validator } from "../shared/middlewares/validator.ts";
import { UpdateUsersRequestSchema, UsersQuerySchema } from "../controllers/types/controllers.types.ts";
import { AdminUsersController } from "../controllers/admin/admin.controller.ts";

export const adminRouter = express.Router();

adminRouter.get("/",
  requireAuthAndNotBlocked,
  requireAdmin,
  Validator.requestQueryValidate(UsersQuerySchema),
  AdminUsersController.getUsers);
adminRouter.post("/users/block",
  requireAuthAndNotBlocked,
  requireAdmin,
  Validator.requestBodyValidate(UpdateUsersRequestSchema),
  AdminUsersController.block);

adminRouter.post("/users/unblock",
  requireAuthAndNotBlocked,
  requireAdmin,
  Validator.requestBodyValidate(UpdateUsersRequestSchema),
  AdminUsersController.unblock);

adminRouter.post("/users/promote",
  requireAuthAndNotBlocked,
  requireAdmin,
  Validator.requestBodyValidate(UpdateUsersRequestSchema),
  AdminUsersController.promote);

adminRouter.post("/users/demote",
  requireAuthAndNotBlocked,
  requireAdmin,
  Validator.requestBodyValidate(UpdateUsersRequestSchema),
  AdminUsersController.demote);

adminRouter.delete("/users",
  requireAuthAndNotBlocked,
  requireAdmin,
  Validator.requestBodyValidate(UpdateUsersRequestSchema),
  AdminUsersController.remove);