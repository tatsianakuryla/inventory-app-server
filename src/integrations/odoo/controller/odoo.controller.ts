import type { Request, Response } from "express";
import { randomBytes } from "crypto";
import prisma from "../../../shared/db/db.js";
import { handleError } from "../../../users/shared/helpers/helpers.js";
import type {
  CreateApiTokenResponseBody,
  GetInventoryDataResponseBody,
  TokenQuery,
} from "../shared/odoo.types.js";
import type { InventoryParameters } from "../../../inventory/shared/types/inventory.schemas.js";
import { AggregationService } from "../../../inventory/shared/services/aggregation.service.js";

export class OdooController {
  /**
   * Creates or returns an existing API token for a given inventory.
   * 
   * The token is stored in the inventory.odooToken field and can be used
   * by external systems (e.g., Odoo) to fetch inventory data without
   * authenticating as an application user.
   * 
   * Token generation: crypto.randomBytes(32) -> 64 hex characters
   */
  public static createApiToken = async (
    request: Request<InventoryParameters>,
    response: Response<CreateApiTokenResponseBody>,
  ): Promise<Response<CreateApiTokenResponseBody>> => {
    const { inventoryId } = request.params;

    try {
      const inventory = await prisma.inventory.findUnique({
        where: { id: inventoryId },
        select: { id: true, odooToken: true },
      });
      if (!inventory) {
        return response.status(404).json({ message: "Inventory not found" });
      }
      if (inventory.odooToken) {
        return response.status(200).json({ token: inventory.odooToken });
      }
      const token = randomBytes(32).toString("hex");
      await prisma.inventory.update({
        where: { id: inventoryId },
        data: { odooToken: token },
      });
      return response.status(200).json({ token });
    } catch (error) {
      return handleError(error, response);
    }
  };

  /**
   * Returns aggregated inventory data based on an API token.
   * 
   * External systems call this endpoint with a token instead of user credentials.
   * The token is mapped to an inventory, then:
   *  - basic inventory info is returned (id, name, description)
   *  - total number of items is calculated
   *  - field-level aggregations are calculated using AggregationService
   * 
   * Key method: Uses AggregationService.calculateFieldAggregations()
   */
  public static getInventoryData = async (
    _request: Request,
    response: Response<GetInventoryDataResponseBody>,
  ): Promise<Response<GetInventoryDataResponseBody>> => {
    const { token } = response.locals.query as TokenQuery;
    try {
      const inventory = await prisma.inventory.findUnique({
        where: { odooToken: token },
        select: {
          id: true,
          name: true,
          description: true,
          fields: true,
          items: {
            select: {
              text1: true,
              text2: true,
              text3: true,
              long1: true,
              long2: true,
              long3: true,
              num1: true,
              num2: true,
              num3: true,
              link1: true,
              link2: true,
              link3: true,
              bool1: true,
              bool2: true,
              bool3: true,
            },
          },
        },
      });
      if (!inventory) {
        return response.status(404).json({ message: "Inventory not found or invalid token" });
      }
      const fields = AggregationService.calculateFieldAggregations(
        inventory.items,
        inventory.fields,
      );
      return response.status(200).json({
        inventoryId: inventory.id,
        inventoryName: inventory.name,
        description: inventory.description,
        totalItems: inventory.items.length,
        fields,
      });
    } catch (error) {
      return handleError(error, response);
    }
  };
}
