import { Router } from "express";
import { Validator } from "../../shared/middlewares/validator.ts";
import {
  ItemParametersSchema,
  ItemListQuerySchema,
  ItemCreateSchema,
  ItemUpdateSchema,
  DeleteItemsBodySchema,
} from "../shared/types/schemas.ts";
import { requireAuthAndNotBlocked } from "../../shared/middlewares/requireAuthAndNotBlocked.ts";
import { ItemsController } from "../controllers/items.controller.ts";
import { requireCanEditItems } from "../shared/middlewares/requireCanEditItems.ts";

export const itemsRouter = Router();

itemsRouter.get(
  "/:inventoryId",
  Validator.requestParamsValidate(ItemParametersSchema.pick({ inventoryId: true })),
  Validator.requestQueryValidate(ItemListQuerySchema),
  ItemsController.getMany
);

itemsRouter.get(
  "/:inventoryId/:itemId",
  Validator.requestParamsValidate(ItemParametersSchema),
  ItemsController.getOne
);

itemsRouter.post(
  "/:inventoryId",
  Validator.requestParamsValidate(ItemParametersSchema.pick({ inventoryId: true })),
  requireAuthAndNotBlocked,
  requireCanEditItems,
  Validator.requestBodyValidate(ItemCreateSchema),
  ItemsController.create
);

itemsRouter.patch(
  "/:inventoryId/:itemId",
  Validator.requestParamsValidate(ItemParametersSchema),
  requireAuthAndNotBlocked,
  requireCanEditItems,
  Validator.requestBodyValidate(ItemUpdateSchema),
  ItemsController.update
);

itemsRouter.delete(
  "/:inventoryId",
  Validator.requestParamsValidate(ItemParametersSchema.pick({ inventoryId: true })),
  requireAuthAndNotBlocked,
  requireCanEditItems,
  Validator.requestBodyValidate(DeleteItemsBodySchema),
  ItemsController.removeMany
);

itemsRouter.post(
  "/:inventoryId/:itemId/like",
  Validator.requestParamsValidate(ItemParametersSchema),
  requireAuthAndNotBlocked,
  ItemsController.like
);

itemsRouter.delete(
  "/:inventoryId/:itemId/like",
  Validator.requestParamsValidate(ItemParametersSchema),
  requireAuthAndNotBlocked,
  ItemsController.unlike
);
