import { z } from "zod";
import type { NextFunction, Request, Response} from "express";
import { isZodError } from "../typeguards/typeguards.ts";

export class Validator {

  public static requestBodyValidate(schema: z.ZodSchema) {
    return (request: Request, response: Response, next: NextFunction,) => {
      try {
        request.body = schema.parse(request.body);
        return next();
      } catch (error) {
        if (isZodError(error)) {
          return response.status(400).json({ error: error.issues.map((issue) => ({
              message: issue.message,
            })), });
        }
        next(error);
      }
    }
  }

}