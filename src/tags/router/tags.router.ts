import { Router } from "express";
import { Validator } from "../../shared/middlewares/validator.ts";
import { requireAuthAndNotBlocked } from "../../shared/middlewares/requireAuthAndNotBlocked.ts";
import { requireCanManageInventory } from "../../inventory/shared/middlewares/requireCanManageInventory.ts";
import { TagsController } from "../controllers/tags.controller.ts";
import {
  TagCreateSchema,
  TagsQuerySchema,
  PopularTagsQuerySchema,
  UpdateInventoryTagsSchema,
} from "../shared/types/tags.schemas.ts";
import {InventoryParametersSchema} from "../../inventory/shared/types/inventory.schemas.ts";

export const tagsRouter = Router();

tagsRouter.get("/", Validator.requestQueryValidate(TagsQuerySchema), TagsController.getAll);

tagsRouter.get(
  "/popular",
  Validator.requestQueryValidate(PopularTagsQuerySchema),
  TagsController.getPopular,
);

tagsRouter.post(
  "/",
  requireAuthAndNotBlocked,
  Validator.requestBodyValidate(TagCreateSchema),
  TagsController.create,
);

tagsRouter.get(
  "/inventory/:inventoryId",
  Validator.requestParamsValidate(InventoryParametersSchema),
  TagsController.getInventoryTags,
);

tagsRouter.put(
  "/inventory/:inventoryId",
  Validator.requestParamsValidate(InventoryParametersSchema),
  requireAuthAndNotBlocked,
  requireCanManageInventory,
  Validator.requestBodyValidate(UpdateInventoryTagsSchema),
  TagsController.updateInventoryTags,
);
