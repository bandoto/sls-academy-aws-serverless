import { sesClient } from "../helpers/providers";
import {
  ListIdentitiesCommand,
  SendEmailCommand,
  VerifyEmailIdentityCommand,
} from "@aws-sdk/client-ses";

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

    const listIdentitiesResponse = await sesClient.send(
      new ListIdentitiesCommand({})
    );

    const verifiedEmails = listIdentitiesResponse.Identities ?? [];

    if (!verifiedEmails.includes(EMAIL)) {
      await sesClient.send(
        new VerifyEmailIdentityCommand({ EmailAddress: EMAIL })
      );
      console.log(`Email ${EMAIL} has been verified.`);
    } else {
      console.log(`Email ${EMAIL} is already verified.`);
    }

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

    await sesClient.send(new SendEmailCommand(emailParams));
  } catch (error) {
    console.error(error);
  }
};
