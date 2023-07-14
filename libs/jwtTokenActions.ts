import jwt, { JwtPayload } from "jsonwebtoken";
import {
  UpdateItemCommand,
  UpdateItemCommandOutput,
} from "@aws-sdk/client-dynamodb";
import { dynamoDbClient } from "../helpers/providers";

interface ISignResponse {
  success: boolean;
  error?: string;
  data?: {
    id?: string;
    accessToken?: string;
    refreshToken?: string;
    email?: string;
  };
}

interface IValidTokenResponse {
  userId: string;
  email: string;
}

export const generateTokens = (payload: {
  userId: string;
  email: string;
}): { accessToken: string; refreshToken: string } => {
  const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET!, {
    expiresIn: "60m",
  });
  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET!);

  return {
    accessToken,
    refreshToken,
  };
};

export const validAccessToken = (
  token: string
): JwtPayload | IValidTokenResponse => {
  try {
    return jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as
      | JwtPayload
      | ISignResponse;
  } catch (error) {
    return {
      success: false,
      error: "Cant valid jwt access token",
    };
  }
};

export const validRefreshToken = (
  token: string
): JwtPayload | IValidTokenResponse => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as
      | JwtPayload
      | ISignResponse;
  } catch (error) {
    return {
      success: false,
      error: "Cant valid jwt refresh token",
    };
  }
};

export const saveToken = async (
  userId: string,
  refreshToken: string
): Promise<UpdateItemCommandOutput> => {
  try {
    const params = {
      TableName: process.env.USERS_TABLE,
      Key: {
        id: { S: userId },
      },
      UpdateExpression: "SET refresh_token = :refreshToken",
      ExpressionAttributeValues: {
        ":refreshToken": { S: refreshToken },
      },
      ReturnValues: "ALL_NEW",
    };

    const command = new UpdateItemCommand(params);

    return await dynamoDbClient.send(command);
  } catch (error) {
    console.error("Error saving token:", error);
    throw error;
  }
};
