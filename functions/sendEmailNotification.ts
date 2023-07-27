import { sesClient } from "../helpers/providers";
import { SendEmailCommand } from "@aws-sdk/client-ses";

interface Event {
  Records: [
    {
      body: string;
    }
  ];
}

export const sendEmailNotification = async (event: Event): Promise<void> => {
  try {
    const { body } = event.Records[0];
    const { message } = JSON.parse(body);

    const EMAIL = process.env.EMAIL!;

    const emailParams = {
      Destination: {
        ToAddresses: [EMAIL],
      },
      Message: {
        Body: {
          Text: {
            Data: message,
          },
        },
        Subject: {
          Data: "Notification - Post Deactivation",
        },
      },
      Source: EMAIL,
    };

    console.log(message, EMAIL);

    await sesClient.send(new SendEmailCommand(emailParams));
  } catch (error) {
    console.error(error);
  }
};
