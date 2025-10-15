import express from "express";
import {
  LoginRequestBodySchema,
  RegisterRequestBodySchema,
  AutocompleteQuerySchema
} from "../controllers/types/controllers.types.ts";
import { Validator } from "../shared/middlewares/validator.ts";
import { UserController } from "../controllers/user.controller.ts";
import { requireNotBlocked } from "../shared/middlewares/requireNotBlocked.ts";
import { requireAuth } from "../shared/middlewares/requireAuth.ts";
import { FacebookLoginSchema, GoogleLoginSchema } from "../controllers/social/social.types.ts";
import { SocialController } from "../controllers/social/social.controller.ts";
export const usersRouter = express.Router();

usersRouter.get('me',
  requireAuth,
  requireNotBlocked, UserController.getMe);

usersRouter.get('/autocomplete',
  requireAuth,
  requireNotBlocked,
  Validator.requestQueryValidate(AutocompleteQuerySchema), UserController.autocompleteGetUsers);

usersRouter.post("/register", Validator.requestBodyValidate(RegisterRequestBodySchema), UserController.register);
usersRouter.post("/login", Validator.requestBodyValidate(LoginRequestBodySchema), UserController.login);
usersRouter.post("/google/login", Validator.requestBodyValidate(GoogleLoginSchema), SocialController.googleLogin);
usersRouter.post("/facebook/login", Validator.requestBodyValidate(FacebookLoginSchema), SocialController.facebookLogin);
