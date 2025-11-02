import express from "express";
import { HomeController } from "../controllers/home.controller.ts";
import { Validator } from "../../shared/middlewares/validator.ts";
import {
  HomePopularQuerySchema,
  HomeRecentQuerySchema,
  TagCloudQuerySchema,
} from "../shared/types/home.schemas.ts";

export const homeRouter = express.Router();

homeRouter.get(
  "/recent",
  Validator.requestQueryValidate(HomeRecentQuerySchema),
  HomeController.getRecent,
);

homeRouter.get(
  "/popular",
  Validator.requestQueryValidate(HomePopularQuerySchema),
  HomeController.getPopular,
);

homeRouter.get(
  "/tag-cloud",
  Validator.requestQueryValidate(TagCloudQuerySchema),
  HomeController.getTagCloud,
);