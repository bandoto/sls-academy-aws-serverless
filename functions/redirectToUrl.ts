import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { ScanCommand, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { BASE_URL } from "../helpers/constants";
import { dynamoDbClient } from "../helpers/providers";
import { sendMessageQueue } from "../libs/sendMessageQueue";
import { deleteFromTable } from "../libs/dynamodbHelpers";
import { createError } from "../helpers/functions";

export const redirectToUrl = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { shortedUrl } = event.pathParameters as {
      shortedUrl: string;
    };

    const fullUrl: string = `${BASE_URL}/${shortedUrl}`;

    const command: ScanCommand = new ScanCommand({
      TableName: process.env.LINKS_TABLE!,
      FilterExpression: "shortedUrl = :fullUrl",
      ExpressionAttributeValues: {
        ":fullUrl": { S: fullUrl },
      },
    });

    const existUrl = await dynamoDbClient.send(command);

    if (!existUrl.Items || existUrl.Items.length === 0) {
      return createError(404, { success: false, error: "URL not found" });
    }

    const originalUrl = existUrl.Items[0].originalUrl.S;
    const itemId = existUrl.Items[0].id.S;
    const existDisposable = existUrl.Items[0].disposable.BOOL;

    if (!originalUrl) {
      return createError(404, {
        success: false,
        error: "Something went wrong",
      });
    }

    const response: APIGatewayProxyResult = {
      statusCode: 302,
      headers: {
        Location: String(originalUrl),
      },
      body: "",
    };

    if (itemId) {
      const params = {
        TableName: process.env.LINKS_TABLE,
        Key: {
          id: { S: itemId },
        },
        UpdateExpression: "ADD clickCounter :increment",
        ExpressionAttributeValues: {
          ":increment": { N: "1" },
        },
        ReturnValues: "ALL_NEW",
      };

      const clickCounterCommand = new UpdateItemCommand(params);

      await dynamoDbClient.send(clickCounterCommand);
    }

    if (itemId && existDisposable) {
      await deleteFromTable(process.env.LINKS_TABLE!, itemId);

      await sendMessageQueue(itemId);
    }

    return response;
  } catch (error) {
    return createError(500, {
      success: false,
      error: error,
    });
  }
};
