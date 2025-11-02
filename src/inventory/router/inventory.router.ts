import { Router } from "express";
import { Validator } from "../../shared/middlewares/validator.ts";
import {
  InventoryCreateRequestSchema,
  InventoryListQuerySchema,
  DeleteInventoriesBodySchema,
  InventoryUpdateRequestSchema,
  UpsertAccessBodySchema,
  RevokeAccessBodySchema,
  type InventoryParameters,
  UpdateInventoryFieldsBodySchema,
  InventoryIdFormatUpdateBodySchema,
} from "../shared/types/inventory.schemas.ts";
import { InventoryController } from "../controllers/inventory.controller.ts";
import { requireAuthAndNotBlocked } from "../../shared/middlewares/requireAuthAndNotBlocked.ts";
import { requireCanManageInventory } from "../shared/middlewares/requireCanManageInventory.ts";

export const inventoryRouter = Router();

inventoryRouter.post(
  "/",
  requireAuthAndNotBlocked,
  Validator.requestBodyValidate(InventoryCreateRequestSchema),
  InventoryController.create,
);

inventoryRouter.get(
  "/",
  Validator.requestQueryValidate(InventoryListQuerySchema),
  InventoryController.getAll,
);

inventoryRouter.get<InventoryParameters>("/:inventoryId", InventoryController.getOne);

inventoryRouter.patch<InventoryParameters>(
  "/:inventoryId",
  requireAuthAndNotBlocked,
  requireCanManageInventory,
  Validator.requestBodyValidate(InventoryUpdateRequestSchema),
  InventoryController.update,
);

inventoryRouter.delete(
  "/",
  requireAuthAndNotBlocked,
  Validator.requestBodyValidate(DeleteInventoriesBodySchema),
  InventoryController.removeMany,
);

inventoryRouter.get<InventoryParameters>(
  "/:inventoryId/access",
  requireAuthAndNotBlocked,
  requireCanManageInventory,
  InventoryController.getAccessData,
);

inventoryRouter.put<InventoryParameters>(
  "/:inventoryId/access",
  requireAuthAndNotBlocked,
  requireCanManageInventory,
  Validator.requestBodyValidate(UpsertAccessBodySchema),
  InventoryController.updateInventoryAccess,
);

inventoryRouter.delete<InventoryParameters>(
  "/:inventoryId/access",
  requireAuthAndNotBlocked,
  requireCanManageInventory,
  Validator.requestBodyValidate(RevokeAccessBodySchema),
  InventoryController.deleteAccess,
);

inventoryRouter.put<InventoryParameters>(
  "/:inventoryId/fields",
  requireAuthAndNotBlocked,
  requireCanManageInventory,
  Validator.requestBodyValidate(UpdateInventoryFieldsBodySchema),
  InventoryController.updateInventoryFields,
);

inventoryRouter.put<InventoryParameters>(
  "/:inventoryId/id-format",
  requireAuthAndNotBlocked,
  requireCanManageInventory,
  Validator.requestBodyValidate(InventoryIdFormatUpdateBodySchema),
  InventoryController.updateIdFormat,
);

inventoryRouter.get<InventoryParameters>(
  "/:inventoryId/statistics",
  InventoryController.getStatistics,
);
