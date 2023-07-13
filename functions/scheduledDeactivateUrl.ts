import { DeleteItemCommand } from "@aws-sdk/client-dynamodb";
import { dynamoDbClient } from "../helpers/providers";
import { sendMessageQueue } from "../libs/sendMessageQueue";

interface ScheduledDeactivateUrlEvent {
  urlId: string;
}

export const scheduledDeactivateUrl = async (
  event: ScheduledDeactivateUrlEvent
): Promise<void> => {
  try {
    await sendMessageQueue(event.urlId);

    const deleteCommand: DeleteItemCommand = new DeleteItemCommand({
      TableName: process.env.LINKS_TABLE!,
      Key: { id: { S: event.urlId } },
    });

    await dynamoDbClient.send(deleteCommand);
  } catch (error) {
    console.log(error);
  }
};
