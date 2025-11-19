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
  /**
   * - Determines the target user:
   *    - If `request.body.userId` is provided (admin), uses that user id.
   *    - Otherwise, uses the currently authenticated user (`request.user.sub`).
   * - Checks in the local database (Prisma) if this user is already linked
   *   to a Salesforce account via the `salesforceIntegration` table.
   *    - If a record exists, returns HTTP 409 with a message that the account
   *      already exists in Salesforce.
   * - If there is no existing integration:
   *    - Calls `SalesforceService.createAccountWithContact(account, contact)` to create
   *      an Account and a related Contact in Salesforce.
   *    - On success, stores the `accountId` (and implicitly links it) in the
   *      `salesforceIntegration` table for the target user.
   *    - Returns the `{ accountId, contactId }` payload as JSON.
   *
   */
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
