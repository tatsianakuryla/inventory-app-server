import express from "express";
import { requireAuthAndNotBlocked } from "../../../shared/middlewares/requireAuthAndNotBlocked.js";
import { SalesforceController } from "../controller/salesforce.controller.js";
import { Validator } from "../../../shared/middlewares/validator.js";
import { SalesforceAccountWithContactResponseSchema } from "../shared/salesforce.schemas.js";

export const salesforceRouter = express.Router();

salesforceRouter.post(
  "/create-account-with-contact",
  requireAuthAndNotBlocked,
  Validator.requestBodyValidate(SalesforceAccountWithContactResponseSchema),
  SalesforceController.createSalesforceAccountWithContact,
);
