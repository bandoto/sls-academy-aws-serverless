import {
  CreateScheduleCommand,
  CreateScheduleCommandInput,
  SchedulerClient,
} from "@aws-sdk/client-scheduler";
// @ts-ignore
import { nanoid } from "nanoid";

export const addToScheduler = async (
  urlId: string,
  expireDate: string
): Promise<void> => {
  const scheduler: SchedulerClient = new SchedulerClient({});
  const schedulerParams: CreateScheduleCommandInput = {
    FlexibleTimeWindow: {
      Mode: "OFF",
    },
    Name: nanoid(3) + "-" + urlId,
    ScheduleExpression: `at(${expireDate.substring(0, 19)})`,
    Target: {
      Arn: `arn:aws:lambda:${process.env.REGION}:${process.env.ACCOUNT_ID}:function:sls-typescript-http-api-dev-${process.env.SCHEDULED_DEACTIVATE}`,
      RoleArn: `arn:aws:iam::${process.env.ACCOUNT_ID}:role/event-bridger-role`,
      Input: JSON.stringify({ urlId }),
    },
    State: "ENABLED",
  };

  await scheduler.send(new CreateScheduleCommand(schedulerParams));
};
