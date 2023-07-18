import { sendMessageQueue } from "../libs/sendMessageQueue";
import { deleteFromTable } from "../libs/dynamodbHelpers";

interface ScheduledDeactivateUrlEvent {
  urlId: string;
}

export const scheduledDeactivateUrl = async (
  event: ScheduledDeactivateUrlEvent
): Promise<void> => {
  try {
    await sendMessageQueue(event.urlId);

    await deleteFromTable(process.env.LINKS_TABLE!, event.urlId);
  } catch (error) {
    console.log(error);
  }
};
