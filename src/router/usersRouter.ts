import express from "express";
import {
  LoginRequestBodySchema,
  RegisterRequestBodySchema,
  AutocompleteQuerySchema
} from "../controllers/types.ts";
import { Validator } from "../shared/middlewares/validator.ts";
import { UserControllers } from "../controllers/user.controllers.ts";
import { requireNotBlocked } from "../shared/middlewares/requireNotBlocked.ts";
import { requireAuth } from "../shared/middlewares/requireAuth.ts";

export const usersRouter = express.Router();

usersRouter.get('/autocomplete',
  requireAuth,
  requireNotBlocked,
  Validator.requestQueryValidate(AutocompleteQuerySchema), UserControllers.autocompleteGetUsers);

usersRouter.post("/register", Validator.requestBodyValidate(RegisterRequestBodySchema), UserControllers.register);

usersRouter.post("/login", Validator.requestBodyValidate(LoginRequestBodySchema), UserControllers.login);
