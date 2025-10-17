import type { AppJwtPayload } from "../../controllers/types/controllers.types.ts";

declare module "express-serve-static-core" {
  interface Request {
    user: AppJwtPayload;
  }
}