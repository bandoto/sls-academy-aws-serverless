import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { ScanCommand } from "@aws-sdk/client-dynamodb";
import { dynamoDbClient } from "../helpers/providers";
import { createError, createResponse } from "../helpers/functions";

export const getMyProfile = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const userId = event.requestContext?.authorizer?.principalId;
    const userEmail = event.requestContext?.authorizer?.claims.email;

    if (!userId) {
      return createError(401, { success: false, error: "Unauthorized" });
    }

    const command: ScanCommand = new ScanCommand({
      TableName: process.env.LINKS_TABLE!,
      FilterExpression: "userId = :userId",
      ExpressionAttributeValues: {
        ":userId": { S: userId },
      },
    });

    const existUserUrls = await dynamoDbClient.send(command);

    const userUrls = existUserUrls.Items;

    return createResponse(200, {
      userId,
      userEmail,
      userUrls,
    });
  } catch (error) {
    return createError(500, {
      success: false,
      error: error,
    });
  }
};
