import { validAccessToken } from "../libs/jwtTokenActions";
import {
  APIGatewayAuthorizerResult,
  APIGatewayTokenAuthorizerEvent,
  Callback,
  PolicyDocument,
} from "aws-lambda";

export const checkIsAuth = async (
  event: APIGatewayTokenAuthorizerEvent,
  context: any,
  callback: Callback<APIGatewayAuthorizerResult>
): Promise<void> => {
  const accessToken = event.authorizationToken.split(" ")[1];
  const methodArn = event.methodArn;

  if (!accessToken || !methodArn) {
    return callback("Unauthorized");
  }

  const userToken = validAccessToken(accessToken);

  if (!userToken || !userToken.userId) {
    return callback(null, generateAuthResponse("user", "Deny", methodArn));
  }

  return callback(
    null,
    generateAuthResponse(userToken.userId, "Allow", methodArn)
  );
};

const generateAuthResponse = (
  principalId: string,
  effect: "Allow" | "Deny",
  methodArn: string
): APIGatewayAuthorizerResult | undefined => {
  if (!effect || !methodArn) return undefined;

  const policyDocument: PolicyDocument = {
    Version: "2012-10-17",
    Statement: [
      {
        Action: "execute-api:Invoke",
        Effect: effect,
        Resource: methodArn,
      },
    ],
  };

  return {
    principalId,
    policyDocument,
  };
};
