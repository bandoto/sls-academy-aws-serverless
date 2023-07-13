import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { EventBridgeClient } from "@aws-sdk/client-eventbridge";
import { SQSClient } from "@aws-sdk/client-sqs";
import { SESClient } from "@aws-sdk/client-ses";

const REGION = process.env.REGION;

const sesClient = new SESClient({ region: REGION });
const sqsClient = new SQSClient({ region: REGION });
const dynamoDbClient = new DynamoDBClient({ region: REGION });
const eventBridgeClient = new EventBridgeClient({ region: REGION });

export { dynamoDbClient, eventBridgeClient, sqsClient, sesClient };
