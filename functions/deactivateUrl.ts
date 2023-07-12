import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DeleteItemCommand, ScanCommand } from "@aws-sdk/client-dynamodb";
import { dynamoDbClient, sqsClient } from "../helpers/db";
import { SendMessageCommand } from "@aws-sdk/client-sqs";

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

    const queueParams = {
      MessageBody: JSON.stringify({
        message: `Link with ID has been deactivated`,
      }),
      QueueUrl: `https://sqs.us-east-1.amazonaws.com/${process.env.ACCOUNT_ID}/shorturl-queue-2`,
    };
    await sqsClient.send(new SendMessageCommand(queueParams));

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
