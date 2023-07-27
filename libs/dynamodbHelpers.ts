import { DeleteItemCommand } from "@aws-sdk/client-dynamodb";
import { dynamoDbClient } from "../helpers/providers";

export const deleteFromTable = async (table: string, id: string) => {
  const deleteCommand: DeleteItemCommand = new DeleteItemCommand({
    TableName: table,
    Key: { id: { S: id } },
  });

  await dynamoDbClient.send(deleteCommand);
};
