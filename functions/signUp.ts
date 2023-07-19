import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { PutItemCommand, ScanCommand } from "@aws-sdk/client-dynamodb";
import { dynamoDbClient } from "../helpers/providers";
import bcrypt from "bcryptjs";
// @ts-ignore
import { nanoid } from "nanoid";
import { CookieSerializeOptions, serialize } from "cookie";
import { generateTokens, saveToken } from "../libs/jwtTokenActions";
import { EMAIL_REGEX } from "../helpers/constants";

export const signUp = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { email, password } = JSON.parse(event.body || "") as {
      email: string;
      password: string;
    };

    if (!email || !password) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          error: "Enter email or password",
        }),
      };
    }

    if (!EMAIL_REGEX.test(email)) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          error: "Invalid email format",
        }),
      };
    }

    if (password.length < 4) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          error: "Password must be at least 6 characters long",
        }),
      };
    }

    const command: ScanCommand = new ScanCommand({
      TableName: process.env.USERS_TABLE!,
      FilterExpression: "email = :email",
      ExpressionAttributeValues: {
        ":email": { S: email },
      },
    });

    const existUser = await dynamoDbClient.send(command);

    if (existUser.Items && existUser.Items.length > 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          error: "Email is already registered",
        }),
      };
    }

    const hashedPassword: string = await bcrypt.hash(password, 10);
    const userId: string = nanoid(12);

    const putItemCommand: PutItemCommand = new PutItemCommand({
      TableName: process.env.USERS_TABLE!,
      Item: {
        id: { S: userId },
        email: { S: email },
        password: { S: hashedPassword },
        urls_list: { L: [] },
      },
    });

    await dynamoDbClient.send(putItemCommand);

    const tokens = generateTokens({ userId, email });

    await saveToken(userId, tokens.refreshToken);

    const cookieOptions: CookieSerializeOptions = {
      httpOnly: true,
    };

    const cookieHeaderValue = serialize(
      "refreshToken",
      tokens.refreshToken,
      cookieOptions
    );

    return {
      statusCode: 200,
      headers: {
        "Set-Cookie": cookieHeaderValue,
      },
      body: JSON.stringify({
        id: userId,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      }),
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
