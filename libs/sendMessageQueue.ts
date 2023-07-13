import { sqsClient } from "../helpers/providers";
import { SendMessageCommand } from "@aws-sdk/client-sqs";

export const sendMessageQueue = async (id: string): Promise<void> => {
  const queueParams = {
    MessageBody: JSON.stringify({
      message: `Url with ID ${id} has been deactivated`,
    }),
    QueueUrl: `https://sqs.${process.env.REGION}.amazonaws.com/${process.env.ACCOUNT_ID}/${process.env.QUEUE_NAME}`,
  };

  await sqsClient.send(new SendMessageCommand(queueParams));
};
