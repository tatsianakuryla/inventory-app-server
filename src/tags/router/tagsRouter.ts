import { Router } from "express";
import { Validator } from "../../shared/middlewares/validator.ts";
import { requireAuthAndNotBlocked } from "../../shared/middlewares/requireAuthAndNotBlocked.ts";
import { requireAdmin } from "../../shared/middlewares/requireAdmin.ts";
import { requireCanManageInventory } from "../../inventory/shared/middlewares/requireCanManageInventory.ts";
import { TagsController } from "../controllers/tags.controller.ts";
import {
  TagCreateSchema,
  TagsQuerySchema,
  PopularTagsQuerySchema,
  InventoryParametersSchema,
  UpdateInventoryTagsSchema,
} from "../shared/types/schemas.ts";

export const tagsRouter = Router();

tagsRouter.get(
  "/",
  Validator.requestQueryValidate(TagsQuerySchema),
  TagsController.getAll
);

tagsRouter.get(
  "/popular",
  Validator.requestQueryValidate(PopularTagsQuerySchema),
  TagsController.getPopular
);

tagsRouter.post(
  "/",
  requireAuthAndNotBlocked,
  requireAdmin,
  Validator.requestBodyValidate(TagCreateSchema),
  TagsController.create
);

tagsRouter.get(
  "/inventory/:inventoryId",
  Validator.requestParamsValidate(InventoryParametersSchema),
  TagsController.getInventoryTags
);

tagsRouter.put(
  "/inventory/:inventoryId",
  Validator.requestParamsValidate(InventoryParametersSchema),
  requireAuthAndNotBlocked,
  requireCanManageInventory,
  Validator.requestBodyValidate(UpdateInventoryTagsSchema),
  TagsController.updateInventoryTags
);
