import {
  ListIdentitiesCommand,
  SESClient,
  VerifyEmailIdentityCommand,
} from "@aws-sdk/client-ses";
import dotenv from 'dotenv';
dotenv.config();

const EMAIL = process.env.EMAIL;
const REGION = process.env.REGION;

const sesClient = new SESClient({ region: REGION });

export const verifyEmail = async () => {
  try {
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
  } catch (error) {
      console.error(`Error verifying ${EMAIL}:`, error);
  }
};

verifyEmail();
