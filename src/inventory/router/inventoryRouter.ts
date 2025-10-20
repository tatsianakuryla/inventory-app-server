import { Router } from 'express';
import { Validator } from '../../shared/middlewares/validator.ts'
import {
  InventoryCreateRequestSchema,
  InventoryListQuerySchema,
  InventoryUpdateRequestSchema
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

inventoryRouter.get('/:inventoryId',
  InventoryController.getOne);

inventoryRouter.patch('/:inventoryId',
  requireAuthAndNotBlocked,
  requireCanManageInventory,
  Validator.requestBodyValidate(InventoryUpdateRequestSchema),
  InventoryController.update);