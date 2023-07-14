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
  const accessToken = event.authorizationToken?.replace("Bearer ", "");
  const methodArn = event.methodArn;

  if (!accessToken) {
    return callback(null, generateAuthResponse("Deny", methodArn, ""));
  }

  const userData = validAccessToken(accessToken);

  if (!userData) {
    return callback(null, generateAuthResponse("Deny", methodArn, ""));
  }

  return callback(
    null,
    generateAuthResponse("Allow", methodArn, userData.userId)
  );
};

const generateAuthResponse = (
  effect: string,
  methodArn: string,
  userId: string
): APIGatewayAuthorizerResult => ({
  principalId: userId,
  policyDocument:
    generatePolicyDocument(effect, methodArn) || getDefaultPolicyDocument(),
});

const getDefaultPolicyDocument = (): PolicyDocument => ({
  Version: "2012-10-17",
  Statement: [],
});

const generatePolicyDocument = (
  effect: string,
  methodArn: string
): PolicyDocument | null => {
  if (!effect || !methodArn) return null;

  return {
    Version: "2012-10-17",
    Statement: [
      {
        Action: "execute-api:Invoke",
        Effect: effect,
        Resource: methodArn,
      },
    ],
  };
};
