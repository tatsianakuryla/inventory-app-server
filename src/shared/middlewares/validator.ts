import { z } from "zod";
import type { NextFunction, Request, Response, RequestHandler } from "express";
import { isZodError } from "../typeguards/typeguards.ts";

export class Validator {
  public static requestBodyValidate(schema: z.ZodSchema) {
    return (request: Request, response: Response, next: NextFunction) => {
      try {
        request.body = schema.parse(request.body);
        return next();
      } catch (error) {
        this.handleError(error, response, next);
      }
    };
  }

  public static requestQueryValidate(schema: z.ZodSchema): RequestHandler {
    return (request: Request, response: Response, next: NextFunction) => {
      try {
        response.locals.query = schema.parse(request.query);
        return next();
      } catch (error) {
        this.handleError(error, response, next);
      }
    };
  }

  private static handleError(error: unknown, response: Response, next: NextFunction) {
    if (isZodError(error)) {
      return response.status(400).json({
        error: error.issues.map((issue) => ({
          message: issue.message,
        })),
      });
    }
    next(error);
  }

  public static requestParamsValidate(schema: z.ZodSchema): RequestHandler {
    return (request: Request, response: Response, next: NextFunction) => {
      try {
        const parsed = schema.parse(request.params);
        Object.assign(request.params, parsed);
        return next();
      } catch (error) {
        this.handleError(error, response, next);
      }
    };
  }
}
