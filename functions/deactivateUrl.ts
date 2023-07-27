import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { ScanCommand } from "@aws-sdk/client-dynamodb";
import { dynamoDbClient } from "../helpers/providers";
import { sendMessageQueue } from "../libs/sendMessageQueue";
import { deleteFromTable } from "../libs/dynamodbHelpers";
import { createError, createResponse } from "../helpers/functions";

export const deactivateUrl = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { linkToDeactivate } = JSON.parse(event.body || "") as {
      linkToDeactivate: string;
    };

    const command: ScanCommand = new ScanCommand({
      TableName: process.env.LINKS_TABLE!,
      FilterExpression: "shortedUrl = :linkToDeactivate",
      ExpressionAttributeValues: {
        ":linkToDeactivate": { S: linkToDeactivate },
      },
    });

    const existUrl = await dynamoDbClient.send(command);

    if (!existUrl.Items || existUrl.Items.length === 0) {
      return createError(404, {
        success: false,
        error: "URL not found",
      });
    }

    const itemId = existUrl.Items[0]?.id?.S;

    if (!itemId) {
      return createError(500, {
        success: false,
        error: "Something went wrong",
      });
    }

    await sendMessageQueue(itemId);

    await deleteFromTable(process.env.LINKS_TABLE!, itemId);

    return createResponse(200, { id: itemId });
  } catch (error) {
    return createError(500, {
      success: false,
      error: error,
    });
  }
};
