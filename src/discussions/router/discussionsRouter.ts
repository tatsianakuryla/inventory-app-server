import { Router } from "express";
import { Validator } from "../../shared/middlewares/validator.ts";
import { requireAuthAndNotBlocked } from "../../shared/middlewares/requireAuthAndNotBlocked.ts";
import { DiscussionsController } from "../controllers/discussions.controller.ts";
import {
  InventoryParametersSchema,
  DiscussionIdParametersSchema,
  DiscussionCreateSchema,
  DiscussionsQuerySchema,
} from "../shared/types/schemas.ts";

export const discussionsRouter = Router();

discussionsRouter.get(
  "/:inventoryId",
  Validator.requestParamsValidate(InventoryParametersSchema),
  Validator.requestQueryValidate(DiscussionsQuerySchema),
  DiscussionsController.getMany,
);

discussionsRouter.post(
  "/:inventoryId",
  Validator.requestParamsValidate(InventoryParametersSchema),
  requireAuthAndNotBlocked,
  Validator.requestBodyValidate(DiscussionCreateSchema),
  DiscussionsController.create,
);

discussionsRouter.delete(
  "/:discussionId",
  Validator.requestParamsValidate(DiscussionIdParametersSchema),
  requireAuthAndNotBlocked,
  DiscussionsController.remove,
);
