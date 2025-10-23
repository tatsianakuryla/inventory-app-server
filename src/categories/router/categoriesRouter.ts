import { Router } from "express";
import { Validator } from "../../shared/middlewares/validator.ts";
import { requireAuthAndNotBlocked } from "../../shared/middlewares/requireAuthAndNotBlocked.ts";
import { requireAdmin } from "../../shared/middlewares/requireAdmin.ts";
import { CategoryController } from "../controllers/categories.controller.ts";
import {
  CategoryParametersSchema,
  CategoryQuerySchema,
  CategoryCreateSchema,
  CategoryUpdateSchema,
} from "../shared/types/schemas.ts";

export const categoriesRouter = Router();

categoriesRouter.get(
  "/",
  Validator.requestQueryValidate(CategoryQuerySchema),
  CategoryController.getAll
);

categoriesRouter.get("/stats", CategoryController.getStats);

categoriesRouter.post(
  "/",
  requireAuthAndNotBlocked,
  requireAdmin,
  Validator.requestBodyValidate(CategoryCreateSchema),
  CategoryController.create
);

categoriesRouter.patch(
  "/:categoryId",
  requireAuthAndNotBlocked,
  requireAdmin,
  Validator.requestParamsValidate(CategoryParametersSchema),
  Validator.requestBodyValidate(CategoryUpdateSchema),
  CategoryController.update
);

categoriesRouter.delete(
  "/:categoryId",
  requireAuthAndNotBlocked,
  requireAdmin,
  Validator.requestParamsValidate(CategoryParametersSchema),
  CategoryController.remove
);

categoriesRouter.delete(
  "/:categoryId/force",
  requireAuthAndNotBlocked,
  requireAdmin,
  Validator.requestParamsValidate(CategoryParametersSchema),
  CategoryController.removeWithUncategorize
);
