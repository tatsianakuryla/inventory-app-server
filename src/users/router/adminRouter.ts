import express from "express";
import { requireAuthAndNotBlocked } from "../../shared/middlewares/requireAuthAndNotBlocked.ts";
import { requireAdmin } from "../../shared/middlewares/requireAdmin.ts";
import { Validator } from "../../shared/middlewares/validator.ts";
import { UpdateUsersRequestSchema, UsersQuerySchema } from "../controllers/types/controllers.types.ts";
import { AdminUsersController } from "../controllers/admin/admin.controller.ts";

export const adminRouter = express.Router();

adminRouter.get("/",
  requireAuthAndNotBlocked,
  requireAdmin,
  Validator.requestQueryValidate(UsersQuerySchema),
  (req, res) => AdminUsersController.getUsers(req, res));
adminRouter.post("/users/block",
  requireAuthAndNotBlocked,
  requireAdmin,
  Validator.requestBodyValidate(UpdateUsersRequestSchema),
  (req, res) => AdminUsersController.block(req, res));

adminRouter.post("/users/unblock",
  requireAuthAndNotBlocked,
  requireAdmin,
  Validator.requestBodyValidate(UpdateUsersRequestSchema),
  (req, res) => AdminUsersController.unblock(req, res));

adminRouter.post("/users/promote",
  requireAuthAndNotBlocked,
  requireAdmin,
  Validator.requestBodyValidate(UpdateUsersRequestSchema),
  (req, res) => AdminUsersController.promote(req, res));

adminRouter.post("/users/demote",
  requireAuthAndNotBlocked,
  requireAdmin,
  Validator.requestBodyValidate(UpdateUsersRequestSchema),
  (req, res) => AdminUsersController.demote(req, res));

adminRouter.delete("/users",
  requireAuthAndNotBlocked,
  requireAdmin,
  Validator.requestBodyValidate(UpdateUsersRequestSchema),
  (req, res) => AdminUsersController.remove(req, res));