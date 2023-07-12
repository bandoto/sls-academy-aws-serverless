import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { EventBridgeClient } from "@aws-sdk/client-eventbridge";
import { SQSClient } from "@aws-sdk/client-sqs";

const sqsClient = new SQSClient({ region: "us-east-1" });
const dynamoDbClient = new DynamoDBClient({ region: "us-east-1" });
const eventBridgeClient = new EventBridgeClient({ region: "us-east-1" });

export { dynamoDbClient, eventBridgeClient, sqsClient };
