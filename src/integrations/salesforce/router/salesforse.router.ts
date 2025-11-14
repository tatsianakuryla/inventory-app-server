import express from "express";
import { requireAuthAndNotBlocked } from "../../../shared/middlewares/requireAuthAndNotBlocked.js";

export const salesforceRouter = express.Router();
