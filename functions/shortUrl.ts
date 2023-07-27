import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { PutItemCommand } from "@aws-sdk/client-dynamodb";
// @ts-ignore
import { nanoid } from "nanoid";
import { dynamoDbClient } from "../helpers/providers";
import { BASE_URL, ONE_DAY } from "../helpers/constants";
import { addToScheduler } from "../libs/addToScheduler";
import middy from "middy";
import httpJsonBodyParser from "@middy/http-json-body-parser";
import validateUrlMiddleware from "../middlewares/validateUrlMiddleware";
import { createError, createResponse } from "../helpers/functions";

export const shortUrl = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const requestBody = event.body as unknown;
    const {
      originalUrl,
      disposable = true,
      expiresAt = 0,
    } = requestBody as {
      originalUrl: string;
      disposable: boolean;
      expiresAt: number;
    };

    if (!originalUrl) {
      return createError(400, { success: false, error: "Invalid URL format" });
    }

    const userId = event.requestContext?.authorizer?.principalId;

    if (!userId) {
      return createError(400, { success: false, error: "Unauthorized" });
    }

    const createdDate: string = new Date().toISOString();
    const expireDays: number = expiresAt;
    const expireDate: string = new Date(
      new Date().getTime() + expireDays * ONE_DAY
    ).toISOString();

    const urlShortId: string = nanoid(5);

    const urlId: string = nanoid(10);

    const fullUrl: string = `${BASE_URL}/${urlShortId}`;

    const putItemCommand: PutItemCommand = new PutItemCommand({
      TableName: process.env.LINKS_TABLE!,
      Item: {
        userId: { S: userId },
        id: { S: urlId },
        originalUrl: { S: originalUrl },
        shortedUrl: { S: fullUrl },
        disposable: { BOOL: disposable },
        createdDate: { S: !disposable ? createdDate : "" },
        expireDate: { S: !disposable ? expireDate : "" },
        clickCounter: { N: "0" },
      },
    });

    if (!disposable) {
      await addToScheduler(urlId, expireDate);
    }

    await dynamoDbClient.send(putItemCommand);

    return createResponse(200, {
      fullUrl,
      urlId,
    });
  } catch (error) {
    return createError(500, {
      success: false,
      error: error,
    });
  }
};

export const shortUrlWithMiddleware = middy(shortUrl)
  .use(httpJsonBodyParser())
  .use(validateUrlMiddleware);
