import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { PutItemCommand } from "@aws-sdk/client-dynamodb";
import { nanoid } from "nanoid";
import { isUrl } from "../helpers/functions";
import { dynamoDbClient } from "../helpers/providers";
import { BASE_URL } from "../helpers/constants";
import { addToScheduler } from "../libs/addToScheduler";

export const shortUrl = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const {
      originalUrl,
      disposable = false,
      expiresAt = 30,
    } = JSON.parse(event.body || "") as {
      originalUrl: string;
      disposable: boolean;
      expiresAt: number;
    };

    if (!originalUrl) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, error: "Invalid URL format" }),
      };
    }

    const isBodyUrl: boolean = isUrl(originalUrl);

    if (!isBodyUrl) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, error: "Invalid URL format" }),
      };
    }

    const createdDate: string = new Date().toISOString();
    const expireDays: number = expiresAt;
    const expireDate: string = new Date(
      new Date().getTime() + expireDays * 24 * 60 * 60 * 1000
    ).toISOString();

    const urlShortId: string = nanoid(5);

    const urlId: string = nanoid(10);

    const fullUrl: string = `${BASE_URL}/${urlShortId}`;

    const putItemCommand: PutItemCommand = new PutItemCommand({
      TableName: process.env.LINKS_TABLE!,
      Item: {
        id: { S: urlId },
        originalUrl: { S: originalUrl },
        shortedUrl: { S: fullUrl },
        disposable: { BOOL: disposable },
        createdDate: { S: !disposable ? createdDate : "" },
        expireDate: { S: !disposable ? expireDate : "" },
      },
    });

    if (!disposable) {
      await addToScheduler(urlId, expireDate);
    }

    await dynamoDbClient.send(putItemCommand);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        data: {
          fullUrl,
          urlId,
        },
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error,
      }),
    };
  }
};
