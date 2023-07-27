import { CookieSerializeOptions, parse, serialize } from "cookie";
import {
  APIGatewayProxyEvent,
  APIGatewayProxyHandler,
  APIGatewayProxyResult,
} from "aws-lambda";
import {
  generateTokens,
  saveToken,
  validRefreshToken,
} from "../libs/jwtTokenActions";
import { ScanCommand } from "@aws-sdk/client-dynamodb";
import { dynamoDbClient } from "../helpers/providers";
import { createError, createResponse } from "../helpers/functions";

export const refreshTokens: APIGatewayProxyHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const headers = event.headers || {};
    const cookieHeader = headers.Cookie || "";
    const cookies = parse(cookieHeader);

    const refreshToken = cookies.refreshToken;

    if (!refreshToken) {
      return createError(400, {
        success: false,
        error: "Refresh token not found",
      });
    }

    const userData = await validRefreshToken(refreshToken);

    const command: ScanCommand = new ScanCommand({
      TableName: process.env.USERS_TABLE!,
      FilterExpression: "refresh_token = :refreshToken",
      ExpressionAttributeValues: {
        ":refreshToken": { S: refreshToken },
      },
    });

    const existData = await dynamoDbClient.send(command);

    if (!userData || !existData.Items || existData.Items.length === 0) {
      return createError(400, {
        success: false,
        error: "Refresh token not found",
      });
    }

    const userId: string = existData.Items[0].id.S!;
    const userEmail: string = existData.Items[0].email.S!;

    const tokens = generateTokens({ userId, email: userEmail });

    await saveToken(userId, tokens.refreshToken);

    const cookieOptions: CookieSerializeOptions = {
      httpOnly: true,
    };

    const cookieHeaderValue = serialize(
      "refreshToken",
      tokens.refreshToken,
      cookieOptions
    );

    return createResponse(
      200,
      {
        id: userId,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
      cookieHeaderValue
    );
  } catch (error) {
    return createError(500, {
      success: false,
      error: error,
    });
  }
};
