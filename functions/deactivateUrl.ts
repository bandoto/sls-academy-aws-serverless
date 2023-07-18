import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { ScanCommand } from "@aws-sdk/client-dynamodb";
import { dynamoDbClient } from "../helpers/providers";
import { sendMessageQueue } from "../libs/sendMessageQueue";
import { deleteFromTable, deleteUrlFromUser } from "../libs/dynamodbHelpers";

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
      return {
        statusCode: 404,
        body: JSON.stringify({ success: false, error: "URL not found" }),
      };
    }

    const itemId = existUrl.Items[0]?.id?.S;

    if (!itemId) {
      return {
        statusCode: 500,
        body: JSON.stringify({ success: false, error: "Something went wrong" }),
      };
    }

    await sendMessageQueue(itemId);

    await deleteFromTable(process.env.LINKS_TABLE!, itemId);

    const userId = event.requestContext?.authorizer?.principalId;
    if (!userId) {
      return {
        statusCode: 401,
        body: JSON.stringify({ success: false, error: "Unauthorized" }),
      };
    }

    await deleteUrlFromUser(userId, itemId);

    return {
      statusCode: 200,
      body: JSON.stringify({ id: itemId }),
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
