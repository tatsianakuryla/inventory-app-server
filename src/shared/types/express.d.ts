import type { AppJwtPayload } from "../../users/controllers/types/controllers.types.ts";

declare module "express-serve-static-core" {
  interface Request {
    user: AppJwtPayload;
  }
}