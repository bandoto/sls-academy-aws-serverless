import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { BatchGetItemCommand, GetItemCommand } from "@aws-sdk/client-dynamodb";
import { dynamoDbClient } from "../helpers/providers";

export const getMyProfile = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const userId = event.requestContext?.authorizer?.principalId;
    const userEmail = event.requestContext?.authorizer?.claims.email;

    if (!userId) {
      return {
        statusCode: 401,
        body: JSON.stringify({ success: false, error: "Unauthorized" }),
      };
    }

    const getUserUrlsListParams = {
      TableName: process.env.USERS_TABLE!,
      Key: {
        id: { S: userId },
      },
      ProjectionExpression: "urls_list",
    };

    const getUserUrlsListCommand = new GetItemCommand(getUserUrlsListParams);
    const getUserUrlsListResponse = await dynamoDbClient.send(
      getUserUrlsListCommand
    );

    const urlsList = getUserUrlsListResponse.Item?.urls_list?.L?.map(
      (url) => url.S
    );

    if (!urlsList || urlsList.length === 0) {
      return {
        statusCode: 404,
        body: "Urls not found",
      };
    }

    const getItemsByUrlsListParams = {
      RequestItems: {
        [process.env.LINKS_TABLE!]: {
          Keys: urlsList.map((url) => ({ id: { S: url! } })),
        },
      },
    };

    const getItemsByUrlsListCommand = new BatchGetItemCommand(
      getItemsByUrlsListParams
    );
    const getItemsByUrlsListResponse = await dynamoDbClient.send(
      getItemsByUrlsListCommand
    );

    const links =
      getItemsByUrlsListResponse.Responses?.[process.env.LINKS_TABLE!] || [];

    return {
      statusCode: 200,
      body: JSON.stringify({
        userId,
        userEmail,
        userUrls: links,
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
