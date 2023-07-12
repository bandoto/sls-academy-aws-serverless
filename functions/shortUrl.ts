import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { PutItemCommand, ScanCommand } from "@aws-sdk/client-dynamodb";
import { nanoid } from "nanoid";
import { isUrl } from "../helpers/helpers-funcs";
import { dynamoDbClient, sqsClient } from "../helpers/db";
import { BASE_URL } from "../helpers/constants";
import { SendMessageCommand } from "@aws-sdk/client-sqs";
import {
  CreateScheduleCommand,
  CreateScheduleCommandInput,
  SchedulerClient,
} from "@aws-sdk/client-scheduler";

export const shortUrl = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const {
      originalUrl,
      disposable = false,
      expiresAt = 30,
    } = JSON.parse(event.body || "") as {
      originalUrl: string;
      disposable: boolean;
      expiresAt: number;
    };

    const createdDate: string = new Date().toISOString();
    const expireDays: number = expiresAt;
    const expireDate: string = new Date(
      new Date().getTime() + expireDays * 24 * 60 * 60 * 1000
    ).toISOString();

    if (!originalUrl) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, error: "Invalid URL format" }),
      };
    }

    const isBodyUrl: boolean = isUrl(originalUrl);

    if (!isBodyUrl) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, error: "Invalid URL format" }),
      };
    }

    const urlShortId: string = nanoid(5);

    let result: APIGatewayProxyResult;

    if (disposable) {
      result = await disposableUrl(originalUrl, urlShortId);
    } else {
      result = await reusableUrl(
        originalUrl,
        urlShortId,
        createdDate,
        expireDate
      );
    }

    return result;
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

export const reusableUrl = async (
  originalUrl: string,
  urlShortId: string,
  createdDate: string,
  expireDate: string
): Promise<APIGatewayProxyResult> => {
  const command: ScanCommand = new ScanCommand({
    TableName: process.env.LINKS_TABLE!,
    ExpressionAttributeValues: {
      ":originalUrl": { S: originalUrl },
    },
    FilterExpression: "originalUrl = :originalUrl",
  });

  const postId: string = nanoid(10);

  const existUrl = await dynamoDbClient.send(command);

  if (existUrl.Items && existUrl.Items.length > 0) {
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        data: existUrl.Items[0].shortedUrl.S,
      }),
    };
  } else {
    const fullUrl: string = `${BASE_URL}/${urlShortId}`;

    const putItemCommand: PutItemCommand = new PutItemCommand({
      TableName: process.env.LINKS_TABLE || "",
      Item: {
        id: { S: postId },
        originalUrl: { S: originalUrl },
        shortedUrl: { S: fullUrl },
        disposable: { BOOL: false },
        createdDate: { S: createdDate },
        expireDate: { S: expireDate },
      },
    });

    const scheduler: SchedulerClient = new SchedulerClient({});
    const schedulerParams: CreateScheduleCommandInput = {
      FlexibleTimeWindow: {
        Mode: "OFF",
      },
      Name: nanoid(3) + "-" + postId,
      ScheduleExpression: `at(${expireDate.substring(0, 19)})`,
      Target: {
        Arn: `arn:aws:lambda:us-east-1:${process.env.ACCOUNT_ID}:function:sls-typescript-http-api-dev-scheduledDeactivateUrl`,
        RoleArn: `arn:aws:iam::${process.env.ACCOUNT_ID}:role/event-bridger-role`,
        Input: JSON.stringify({ postId }),
      },
      State: "ENABLED",
    };

    await scheduler.send(new CreateScheduleCommand(schedulerParams));

    await dynamoDbClient.send(putItemCommand);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        data: {
          fullUrl,
          postId,
        },
      }),
    };
  }
};

export const disposableUrl = async (
  originalUrl: string,
  urlShortId: string
): Promise<APIGatewayProxyResult> => {
  const postId: string = nanoid(10);

  const queueParams = {
    MessageBody: JSON.stringify({
      message: `Url with ID ${postId} has been deactivated`,
    }),
    QueueUrl: `https://sqs.us-east-1.amazonaws.com/${process.env.ACCOUNT_ID}/shorturl-queue-2`,
  };
  await sqsClient.send(new SendMessageCommand(queueParams));

  const fullUrl: string = `${BASE_URL}/${urlShortId}`;

  const putItemCommand: PutItemCommand = new PutItemCommand({
    TableName: process.env.LINKS_TABLE || "",
    Item: {
      id: { S: postId },
      originalUrl: { S: originalUrl },
      shortedUrl: { S: fullUrl },
      disposable: { BOOL: true },
    },
  });

  await dynamoDbClient.send(putItemCommand);

  return {
    statusCode: 200,
    body: JSON.stringify({
      success: true,
      data: fullUrl,
    }),
  };
};
