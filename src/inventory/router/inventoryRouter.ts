import { Router } from 'express';
import { Validator } from '../../shared/middlewares/validator.ts'
import {
  InventoryCreateRequestSchema,
  InventoryListQuerySchema, InventoryToDeleteSchema,
  InventoryUpdateRequestSchema,
  UpsertAccessBodySchema,
  type InventoryParameters,
} from "../shared/types/schemas.ts";
import { InventoryController } from "../controllers/inventory.controller.ts";
import { requireAuthAndNotBlocked } from "../../shared/middlewares/requireAuthAndNotBlocked.ts";
import { requireCanManageInventory } from "../shared/middlewares/requireCanManageInventory.ts";

export const inventoryRouter = Router();

inventoryRouter.post('/',
  requireAuthAndNotBlocked,
  Validator.requestBodyValidate(InventoryCreateRequestSchema),
  InventoryController.create);

inventoryRouter.get('/',
  Validator.requestQueryValidate(InventoryListQuerySchema),
  InventoryController.getAll);

inventoryRouter.get<InventoryParameters>('/:inventoryId', InventoryController.getOne);

inventoryRouter.patch<InventoryParameters>(
  "/:inventoryId",
  requireAuthAndNotBlocked,
  requireCanManageInventory,
  Validator.requestBodyValidate(InventoryUpdateRequestSchema),
  InventoryController.update);

inventoryRouter.delete('/',
  requireAuthAndNotBlocked,
  Validator.requestBodyValidate(InventoryToDeleteSchema),
  InventoryController.removeMany);

inventoryRouter.get<InventoryParameters>('/:inventoryId/access',
  requireAuthAndNotBlocked,
  requireCanManageInventory,
  InventoryController.getAccessData);

inventoryRouter.put<InventoryParameters>('/:inventoryId/access',
  requireAuthAndNotBlocked,
  requireCanManageInventory,
  Validator.requestBodyValidate(UpsertAccessBodySchema),
  InventoryController.updateInventoryAccess);