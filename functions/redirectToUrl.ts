import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DeleteItemCommand, ScanCommand } from "@aws-sdk/client-dynamodb";
import { BASE_URL } from "../helpers/constants";
import { dynamoDbClient } from "../helpers/providers";
import { sendMessageQueue } from "../libs/sendMessageQueue";

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

    if (!existUrl.Items) {
      return {
        statusCode: 404,
        body: JSON.stringify({ success: false, error: "URL not found" }),
      };
    }

    const originalUrl = existUrl.Items[0]?.originalUrl?.S!;
    const itemId = existUrl.Items[0]?.id?.S!;
    const existDisposable = existUrl.Items[0]?.disposable?.BOOL!;

    if (!originalUrl) {
      return {
        statusCode: 404,
        body: JSON.stringify({ success: false, error: "Something went wrong" }),
      };
    }

    const response: APIGatewayProxyResult = {
      statusCode: 302,
      headers: {
        Location: String(originalUrl),
      },
      body: "",
    };

    if (itemId && existDisposable) {
      const deleteCommand = new DeleteItemCommand({
        TableName: process.env.LINKS_TABLE!,
        Key: { id: { S: itemId } },
      });

      await sendMessageQueue(itemId);

      await dynamoDbClient.send(deleteCommand);
    }

    return response;
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
