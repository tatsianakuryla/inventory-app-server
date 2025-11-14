import express from "express";
import { requireAuthAndNotBlocked } from "../../../shared/middlewares/requireAuthAndNotBlocked.js";
import { SalesforceController } from "../controller/salesforce.controller.js";
import { Validator } from "../../../shared/middlewares/validator.js";
import { SalesforceAccountWithContactRequestSchema } from "../shared/salesforce.schemas.js";

export const salesforceRouter = express.Router();

salesforceRouter.post(
  "/create-account-with-contact",
  requireAuthAndNotBlocked,
  Validator.requestBodyValidate(SalesforceAccountWithContactRequestSchema),
  SalesforceController.createSalesforceAccountWithContact,
);
