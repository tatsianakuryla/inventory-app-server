import express from "express";
import { HomeController } from "../controllers/home.controller.ts";

export const homeRouter = express.Router();

homeRouter.get("/latest", HomeController.getLatest);
homeRouter.get("/popular", HomeController.getPopular);
homeRouter.get("/tag-cloud", HomeController.getTagCloud);
