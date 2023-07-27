import { APIGatewayProxyResult } from "aws-lambda";

export const isUrl = (url: string): boolean => {
  const regExp = new RegExp(
    "^(https?:\\/\\/)?" +
      "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|" +
      "((\\d{1,3}\\.){3}\\d{1,3}))" +
      "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" +
      "(\\?[;&a-z\\d%_.~+=-]*)?" +
      "(\\#[-a-z\\d_]*)?$",
    "i"
  );

  return regExp.test(url);
};

export const createResponse = (
  statusCode = 200,
  data: Record<any, any>,
  cookieHeaderValue?: string
): APIGatewayProxyResult => {
  const headers: Record<string, string | number | boolean> = cookieHeaderValue
    ? {
        "Set-Cookie": cookieHeaderValue,
      }
    : {};

  return {
    statusCode,
    body: JSON.stringify(data),
    headers,
  };
};

export const createError = (statusCode: number, body: Record<any, any>) => {
  return {
    statusCode,
    body: JSON.stringify(body),
  };
};
