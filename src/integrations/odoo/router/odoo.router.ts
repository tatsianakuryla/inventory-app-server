import express from "express";
import { OdooController } from "../controller/odoo.controller.js";
import { Validator } from "../../../shared/middlewares/validator.js";
import { TokenQuerySchema } from "../shared/odoo.types.js";
import { InventoryParametersSchema } from "../../../inventory/shared/types/inventory.schemas.js";

export const odooRouter = express.Router();

odooRouter.post(
  "/:inventoryId/api-token",
  Validator.requestParamsValidate(InventoryParametersSchema),
  OdooController.createApiToken,
);

odooRouter.get(
  "/data",
  Validator.requestQueryValidate(TokenQuerySchema),
  OdooController.getInventoryData,
);
