import express from "express";
import {
  LoginRequestBodySchema,
  RegisterRequestBodySchema,
  AutocompleteQuerySchema,
  UpdateProfileRequestSchema,
} from "../controllers/types/controllers.types.ts";
import { Validator } from "../../shared/middlewares/validator.ts";
import { UserController } from "../controllers/user/user.controller.ts";
import { requireAuthAndNotBlocked } from "../../shared/middlewares/requireAuthAndNotBlocked.ts";
import { FacebookLoginSchema, GoogleLoginSchema } from "../controllers/social/social.types.ts";
import { SocialController } from "../controllers/social/social.controller.ts";
export const usersRouter = express.Router();

usersRouter.get("/me", requireAuthAndNotBlocked, UserController.getMe);

usersRouter.patch(
  "/me",
  requireAuthAndNotBlocked,
  Validator.requestBodyValidate(UpdateProfileRequestSchema),
  UserController.updateProfile,
);

usersRouter.get(
  "/autocomplete",
  requireAuthAndNotBlocked,
  Validator.requestQueryValidate(AutocompleteQuerySchema),
  (req, res) => UserController.autocompleteGetUsers(req, res),
);

usersRouter.post(
  "/register",
  Validator.requestBodyValidate(RegisterRequestBodySchema),
  UserController.register,
);
usersRouter.post(
  "/login",
  Validator.requestBodyValidate(LoginRequestBodySchema),
  UserController.login,
);
usersRouter.post("/google/login", Validator.requestBodyValidate(GoogleLoginSchema), (req, res) =>
  SocialController.googleLogin(req, res),
);
usersRouter.post(
  "/facebook/login",
  Validator.requestBodyValidate(FacebookLoginSchema),
  (req, res) => SocialController.facebookLogin(req, res),
);
