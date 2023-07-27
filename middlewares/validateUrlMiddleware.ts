import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { MiddlewareObject, NextFunction } from "middy";
import { isUrl } from "../helpers/functions";

const validateUrlMiddleware: MiddlewareObject<
  APIGatewayProxyEvent,
  APIGatewayProxyResult
> = {
  before: (handler, next: NextFunction) => {
    try {
      const { body } = handler.event;

      if (!body || typeof body !== "object") {
        return handler.callback(null, {
          statusCode: 400,
          body: JSON.stringify({
            success: false,
            error: "Invalid request body",
          }),
        });
      }

      const { originalUrl } = body;

      if (!originalUrl || !isUrl(originalUrl)) {
        return handler.callback(null, {
          statusCode: 400,
          body: JSON.stringify({ success: false, error: "Invalid URL format" }),
        });
      }

      next();
    } catch (error) {
      return handler.callback(null, {
        statusCode: 400,
        body: JSON.stringify({ success: false, error: error }),
      });
    }
  },
};

export default validateUrlMiddleware;
