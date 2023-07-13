import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DeleteItemCommand, ScanCommand } from "@aws-sdk/client-dynamodb";
import { dynamoDbClient } from "../helpers/providers";
import { sendMessageQueue } from "../libs/sendMessageQueue";

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

    const deleteCommand: DeleteItemCommand = new DeleteItemCommand({
      TableName: process.env.LINKS_TABLE!,
      Key: { id: { S: itemId } },
    });
    await dynamoDbClient.send(deleteCommand);

    return {
      statusCode: 302,
      body: "",
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
