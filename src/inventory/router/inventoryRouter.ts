import { Router } from 'express';
import { Validator } from '../../shared/middlewares/validator.ts'
import { InventoryCreateRequestSchema } from "../shared/types/schemas.ts";
import { InventoryController } from "../controllers/inventory.controller.ts";
import { requireAuthAndNotBlocked } from "../../shared/middlewares/requireAuthAndNotBlocked.ts";

export const inventoryRouter = Router();

inventoryRouter.post('/',
  requireAuthAndNotBlocked,
  Validator.requestBodyValidate(InventoryCreateRequestSchema),
  InventoryController.create);