import express from "express";
import {
  LoginRequestBodySchema,
  RegisterRequestBodySchema,
  UsersQuerySchema,
  IdsBodySchema,
  AutocompleteQuerySchema
} from "../controllers/types.ts";
import { Validator } from "../shared/middlewares/validator.ts";
import { UserControllers } from "../controllers/user.controllers.ts";
import { AdminUsersController } from "../controllers/adminUsers.controllers.js";
export const usersRouter = express.Router();
export const adminRouter = express.Router();

usersRouter.get('/autocomplete', Validator.requestQueryValidate(AutocompleteQuerySchema), UserControllers.autocompleteGetUsers);
usersRouter.post("/register", Validator.requestBodyValidate(RegisterRequestBodySchema), UserControllers.register);
usersRouter.post("/login", Validator.requestBodyValidate(LoginRequestBodySchema), UserControllers.login);

adminRouter.get('/',
  Validator.requestQueryValidate(UsersQuerySchema),
  AdminUsersController.getUsers);

adminRouter.post("/users/block",
  Validator.requestBodyValidate(IdsBodySchema),
  AdminUsersController.block);

adminRouter.post("/users/unblock",
  Validator.requestBodyValidate(IdsBodySchema),
  AdminUsersController.unblock);

adminRouter.post("/users/promote",
  Validator.requestBodyValidate(IdsBodySchema),
  AdminUsersController.promote);

adminRouter.post("/users/demote",
  Validator.requestBodyValidate(IdsBodySchema),
  AdminUsersController.demote);

adminRouter.delete("/users",
  Validator.requestBodyValidate(IdsBodySchema),
  AdminUsersController.remove);