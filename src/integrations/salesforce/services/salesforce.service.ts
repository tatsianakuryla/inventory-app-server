import axios from "axios";
import { SalesforceTokenCache } from "./salesforce.cache.js";
import type {
  SalesforceAccountCreateRequest,
  SalesforceContactCreateRequest,
  SalesforceResponse,
  SalesforceTokenResponse,
} from "../shared/salesforce.schemas.js";
import type { ResponseError } from "../../../shared/types/types.js";

const salesforceConsumerKey = process.env.SALESFORCE_CONSUMER_KEY;
const salesforceConsumerSecret = process.env.SALESFORCE_CONSUMER_SECRET;
const salesforceTokenUrl = process.env.SALESFORCE_TOKEN_URL;
const salesforceInstanceUrl = process.env.SALESFORCE_INSTANCE_URL;
const salesforceApiVersion = "v65.0";
const salesforceBaseUrl = `${salesforceInstanceUrl}/services/data/${salesforceApiVersion}/sobjects`;
const salesforceAccountUrl = `${salesforceBaseUrl}/Account`;
const salesforceContactUrl = `${salesforceBaseUrl}/Contact`;

export class SalesforceService {
  public static async createAccountWithContact(
    accountBody: SalesforceAccountCreateRequest,
    contactBodyWithoutAccount: Omit<SalesforceContactCreateRequest, "AccountId">,
  ): Promise<{ accountId: string; contactId: string } | ResponseError> {
    if (!salesforceInstanceUrl) {
      return this.handleSalesforceError("SALESFORCE_INSTANCE_URL is not configured");
    }
    const token = await this.getToken();
    const accountResponse = await this.createSalesforceAccount(accountBody, token);
    if (!accountResponse.success) {
      return this.handleSalesforceError(
        `Failed to create Salesforce account: ${JSON.stringify(accountResponse.errors)}`,
      );
    }
    const contactBody: SalesforceContactCreateRequest = {
      ...contactBodyWithoutAccount,
      AccountId: accountResponse.id,
    };
    const contactResponse = await this.createSalesforceContact(contactBody, token);
    if (!contactResponse.success) {
      return this.handleSalesforceError(
        `Failed to create Salesforce contact: ${JSON.stringify(contactResponse.errors)}`,
      );
    }
    return {
      accountId: accountResponse.id,
      contactId: contactResponse.id,
    };
  }

  private static readonly tokenCache = new SalesforceTokenCache();

  private static async getToken(): Promise<string> {
    const cachedToken = this.tokenCache.getToken();
    if (cachedToken) {
      return cachedToken;
    }
    return await this.requestNewAccessToken();
  }

  private static async requestNewAccessToken(): Promise<string> {
    if (!salesforceConsumerKey || !salesforceConsumerSecret || !salesforceTokenUrl) {
      throw new Error("Salesforce credentials are not configured correctly");
    }
    const body = new URLSearchParams();
    body.append("grant_type", "client_credentials");
    body.append("client_id", salesforceConsumerKey);
    body.append("client_secret", salesforceConsumerSecret);

    const response = await axios.post<SalesforceTokenResponse>(
      salesforceTokenUrl,
      body.toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      },
    );
    const token = response.data.access_token;
    this.tokenCache.setToken(token);
    return token;
  }

  private static async createSalesforceAccount(
    requestBody: SalesforceAccountCreateRequest,
    token: string,
  ): Promise<SalesforceResponse> {
    const response = await axios.post<SalesforceResponse>(salesforceAccountUrl, requestBody, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    return response.data;
  }

  private static async createSalesforceContact(
    requestBody: SalesforceContactCreateRequest,
    token: string,
  ): Promise<SalesforceResponse> {
    const response = await axios.post<SalesforceResponse>(salesforceContactUrl, requestBody, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    return response.data;
  }

  private static handleSalesforceError(message: string): ResponseError {
    return { message };
  }
}
