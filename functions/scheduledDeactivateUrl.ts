import { DeleteItemCommand } from "@aws-sdk/client-dynamodb";
import { dynamoDbClient, sqsClient } from "../helpers/db";
import { SendMessageCommand } from "@aws-sdk/client-sqs";

interface ScheduledDeactivateUrlEvent {
  postId: string;
}

export const scheduledDeactivateUrl = async (
  event: ScheduledDeactivateUrlEvent
): Promise<void> => {
  try {
    const queueParams = {
      MessageBody: JSON.stringify({
        message: `Url with ID ${event.postId} has been deactivated`,
      }),
      QueueUrl: `https://sqs.us-east-1.amazonaws.com/${process.env.ACCOUNT_ID}/shorturl-queue-2`,
    };

    await sqsClient.send(new SendMessageCommand(queueParams));

    const deleteCommand: DeleteItemCommand = new DeleteItemCommand({
      TableName: process.env.LINKS_TABLE!,
      Key: { id: { S: event.postId } },
    });

    await dynamoDbClient.send(deleteCommand);
  } catch (error) {
    console.log(error);
  }
};
