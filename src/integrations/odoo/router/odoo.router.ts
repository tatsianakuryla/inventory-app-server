import express from "express";
import { OdooController } from "../controller/odoo.controller.js";
import { Validator } from "../../../shared/middlewares/validator.js";
import { TokenQuerySchema } from "../shared/odoo.types.js";
import { InventoryParametersSchema } from "../../../inventory/shared/types/inventory.schemas.js";

export const odooRouter = express.Router();

// POST /:inventoryId/api-token - Generate or return existing API token for inventory
// Used by frontend to create token for Odoo integration
odooRouter.post(
  "/:inventoryId/api-token",
  Validator.requestParamsValidate(InventoryParametersSchema),
  OdooController.createApiToken,
);

// GET /data?token=xxx - Fetch aggregated inventory data using token
// Called by Odoo module to import inventory statistics
odooRouter.get(
  "/data",
  Validator.requestQueryValidate(TokenQuerySchema),
  OdooController.getInventoryData,
);
