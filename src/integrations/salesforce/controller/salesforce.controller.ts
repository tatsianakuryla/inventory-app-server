import { SalesforceService } from "../services/salesforce.service.js";
import type { Request, Response } from "express";
import type {
  SalesforceAccountWithContactRequest,
  SalesforceAccountWithContactResponse,
} from "../shared/salesforce.schemas.js";
import { handleError } from "../../../users/shared/helpers/helpers.js";
import prisma from "../../../shared/db/db.js";
import type { ResponseError } from "../../../shared/types/types.js";

export class SalesforceController {
  public static createSalesforceAccountWithContact = async (
    request: Request<
      Record<string, never>,
      SalesforceAccountWithContactResponse,
      SalesforceAccountWithContactRequest
    >,
    response: Response<SalesforceAccountWithContactResponse | ResponseError>,
  ): Promise<Response<SalesforceAccountWithContactResponse>> => {
    try {
      const { sub } = request.user;
      const { account, contact, userId } = request.body;
      const targetUserId = userId || sub;
      
      const salesforceIntegrationId = await prisma.salesforceIntegration.findUnique({
        where: {
          userId: targetUserId,
        },
        select: {
          accountId: true,
        },
      });
      if (salesforceIntegrationId) {
        return response
          .status(409)
          .json({ message: "The account is already exists in Salesforce" });
      }
      
      const result = await SalesforceService.createAccountWithContact(account, contact);
      if (result.accountId) {
        await prisma.salesforceIntegration.create({
          data: {
            accountId: result.accountId,
            userId: targetUserId,
          },
        });
      }
      return response.json(result);
    } catch (error) {
      return handleError(error, response);
    }
  };
}
