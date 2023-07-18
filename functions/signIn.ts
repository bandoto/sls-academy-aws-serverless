import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { ScanCommand } from "@aws-sdk/client-dynamodb";
import { dynamoDbClient } from "../helpers/providers";
import bcrypt from "bcryptjs";
import { CookieSerializeOptions, serialize } from "cookie";
import { generateTokens, saveToken } from "../libs/jwtTokenActions";

export const signIn = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { email, password } = JSON.parse(event.body || "") as {
      email: string;
      password: string;
    };

    if (email.length < 1 || password.length < 1) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          error: "Enter email or password",
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

    if (!existUser.Items || existUser.Items.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          success: false,
          error: "User with this email was not found",
        }),
      };
    }

    const userPassword: string = existUser.Items[0].password.S!;
    const userId: string = existUser.Items[0].id.S!;

    const isPassEquals: boolean = await bcrypt.compare(password, userPassword);

    if (!isPassEquals) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          error: "Incorrect password",
        }),
      };
    }

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
