import { SalesforceService } from "../services/salesforce.service.js";
import type { Request, Response } from "express";
import type {
  SalesforceAccountWithContactRequest,
  SalesforceAccountWithContactResponse,
} from "../shared/salesforce.schemas.js";
import { handleError } from "../../../users/shared/helpers/helpers.js";

export class SalesforceController {
  public static createSalesforceAccountWithContact = async (
    request: Request<
      Record<string, never>,
      SalesforceAccountWithContactResponse,
      SalesforceAccountWithContactRequest
    >,
    response: Response<SalesforceAccountWithContactResponse>,
  ): Promise<Response<SalesforceAccountWithContactResponse>> => {
    try {
      const { account, contact } = request.body;
      const result = await SalesforceService.createAccountWithContact(account, contact);
      return response.json({ accountId: result.accountId, contactId: result.contactId });
    } catch (error) {
      return handleError(error, response);
    }
  };
}
