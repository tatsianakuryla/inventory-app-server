import axios from "axios";
import { SalesforceTokenCache } from "./salesforce.cache.js";
import type {
  SalesforceAccountCreateRequest,
  SalesforceAccountWithContactResponse,
  SalesforceContactCreateRequest,
  SalesforceResponse,
  SalesforceTokenResponse,
} from "../shared/salesforce.schemas.js";
import { SALESFORCE_DUPLICATION } from "../../../shared/constants/constants.js";

const salesforceConsumerKey = process.env.SALESFORCE_CONSUMER_KEY;
const salesforceConsumerSecret = process.env.SALESFORCE_CONSUMER_SECRET;
const salesforceTokenUrl = process.env.SALESFORCE_TOKEN_URL;
const salesforceInstanceUrl = process.env.SALESFORCE_INSTANCE_URL;
const salesforceApiVersion = "v65.0";

type SalesforceErrorDetail = {
  errorCode?: string;
  message?: string;
  duplicateRule?: string;
};

type SalesforceEntityType = "account" | "contact";

export class SalesforceService {
  private static readonly tokenCache = new SalesforceTokenCache();

  public static async createAccountWithContact(
    accountBody: SalesforceAccountCreateRequest,
    contactBodyWithoutAccount: Omit<SalesforceContactCreateRequest, "AccountId">,
  ): Promise<SalesforceAccountWithContactResponse> {
    const { salesforceAccountUrl, salesforceContactUrl } = this.getSalesforceUrls();
    const salesforceAccessToken = await this.getToken();

    let accountId: string | undefined;

    try {
      const accountResponse = await this.createSalesforceRecord(
        salesforceAccountUrl,
        accountBody,
        salesforceAccessToken,
        {
          entityType: "account",
          duplicateMessage: "The account already exists in Salesforce.",
        },
      );

      accountId = accountResponse.id;

      const contactBody: SalesforceContactCreateRequest = {
        ...contactBodyWithoutAccount,
        AccountId: accountId,
      };

      const contactResponse = await this.createSalesforceRecord(
        salesforceContactUrl,
        contactBody,
        salesforceAccessToken,
        {
          entityType: "contact",
          duplicateMessage:
            "A contact with this information already exists in Salesforce. Please use different contact details.",
        },
      );

      return {
        accountId: accountId,
        contactId: contactResponse.id,
      };
    } catch (error) {
      if (accountId) {
        try {
          await this.deleteSalesforceRecord(salesforceAccountUrl, accountId, salesforceAccessToken);
        } catch (rollbackError) {
          console.error('Failed to rollback Salesforce Account:', rollbackError);
        }
      }
      throw error;
    }
  }

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

    const requestBody = new URLSearchParams();
    requestBody.append("grant_type", "client_credentials");
    requestBody.append("client_id", salesforceConsumerKey);
    requestBody.append("client_secret", salesforceConsumerSecret);

    try {
      const response = await axios.post<SalesforceTokenResponse>(
        salesforceTokenUrl,
        requestBody.toString(),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        },
      );
      const accessToken = response.data.access_token;
      this.tokenCache.setToken(accessToken);
      return accessToken;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(
          `Failed to authenticate with Salesforce: ${JSON.stringify(error.response.data)}`,
        );
      }
      throw error;
    }
  }

  private static async createSalesforceRecord<TRequestBody>(
    url: string,
    requestBody: TRequestBody,
    accessToken: string,
    options: {
      entityType: SalesforceEntityType;
      duplicateMessage: string;
    },
  ): Promise<SalesforceResponse> {
    try {
      const response = await axios.post<SalesforceResponse>(url, requestBody, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        }
      });
      return response.data;
    } catch (error) {
      this.handleSalesforceAxiosError(error, options);
    }
  }

  private static async deleteSalesforceRecord(
    baseUrl: string,
    recordId: string,
    accessToken: string,
  ): Promise<void> {
    try {
      await axios.delete(`${baseUrl}/${recordId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });
    } catch (error) {
      throw error;
    }
  }

  private static getSalesforceUrls(): {
    salesforceAccountUrl: string;
    salesforceContactUrl: string;
  } {
    if (!salesforceInstanceUrl) {
      throw new Error("SALESFORCE_INSTANCE_URL is not configured");
    }
    const salesforceBaseUrl = `${salesforceInstanceUrl}/services/data/${salesforceApiVersion}/sobjects`;
    return {
      salesforceAccountUrl: `${salesforceBaseUrl}/Account`,
      salesforceContactUrl: `${salesforceBaseUrl}/Contact`,
    };
  }

  private static handleSalesforceAxiosError(
    error: unknown,
    options: {
      entityType: SalesforceEntityType;
      duplicateMessage: string;
    },
  ): never {
    if (axios.isAxiosError(error) && error.response) {
      const errorData = error.response.data as unknown;

      if (Array.isArray(errorData) && errorData.length > 0) {
        const [firstError] = errorData as SalesforceErrorDetail[];

        const isDuplicateError =
          firstError?.duplicateRule != null || firstError?.errorCode === SALESFORCE_DUPLICATION;

        if (isDuplicateError) {
          throw new Error(options.duplicateMessage);
        }

        if (firstError?.message) {
          throw new Error(`Salesforce Error: ${firstError.message}`);
        }
      }

      throw new Error(`Salesforce API Error: ${JSON.stringify(errorData)}`);
    }
    throw error as Error;
  }
}
