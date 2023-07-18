import {
  AttributeValue,
  DeleteItemCommand,
  GetItemCommand,
  UpdateItemCommand,
} from "@aws-sdk/client-dynamodb";
import { dynamoDbClient } from "../helpers/providers";

export const deleteFromTable = async (table: string, id: string) => {
  const deleteCommand: DeleteItemCommand = new DeleteItemCommand({
    TableName: table,
    Key: { id: { S: id } },
  });

  await dynamoDbClient.send(deleteCommand);
};

export const deleteUrlFromUser = async (
  userId: string,
  urlId: string
): Promise<void> => {
  const getItemParams = {
    TableName: process.env.USERS_TABLE!,
    Key: {
      id: { S: userId },
    },
    ProjectionExpression: "urls_list",
  };

  const getItemCommand: GetItemCommand = new GetItemCommand(getItemParams);
  const getItemResult = await dynamoDbClient.send(getItemCommand);

  const urlsList = getItemResult.Item?.urls_list?.L || [];
  const updatedList = urlsList.filter((item) => item.S !== urlId);

  const updateParams = {
    TableName: process.env.USERS_TABLE!,
    Key: {
      id: { S: userId },
    },
    UpdateExpression: "SET urls_list = :updatedList",
    ExpressionAttributeValues: {
      ":updatedList": { L: updatedList },
    },
  };

  const updateCommand = new UpdateItemCommand(updateParams);
  await dynamoDbClient.send(updateCommand);
};

export const pushUrlToUser = async (
  userId: string,
  urlId: string
): Promise<void> => {
  const urlIdAttributeValue: AttributeValue = { S: urlId };

  const params = {
    TableName: process.env.USERS_TABLE!,
    Key: {
      id: { S: userId },
    },
    UpdateExpression: "SET #attr = list_append(#attr, :value)",
    ExpressionAttributeNames: {
      "#attr": "urls_list",
    },
    ExpressionAttributeValues: {
      ":value": { L: [urlIdAttributeValue] },
    },
  };

  const command = new UpdateItemCommand(params);

  await dynamoDbClient.send(command);
};
