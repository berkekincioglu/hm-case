import * as path from "path";

import * as cdk from "aws-cdk-lib";
import * as events from "aws-cdk-lib/aws-events";
import * as targets from "aws-cdk-lib/aws-events-targets";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import type * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import type { Construct } from "constructs";

interface CronStackProps extends cdk.StackProps {
  amplifyAppUrl: string;
  cronSecret: secretsmanager.ISecret;
}

export class CronStack extends cdk.Stack {
  public readonly cronFunction: lambda.Function;

  constructor(scope: Construct, id: string, props: CronStackProps) {
    super(scope, id, props);

    // Lambda function to trigger the API endpoint
    this.cronFunction = new lambda.Function(this, "FetchDataFunction", {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset(
        path.join(__dirname, "../../lambda/fetch-data")
      ),
      timeout: cdk.Duration.minutes(5), // CoinGecko API can be slow
      memorySize: 256,
      environment: {
        API_URL: props.amplifyAppUrl,
        CRON_SECRET_ARN: props.cronSecret.secretArn,
      },
      description: "Daily cron job to fetch cryptocurrency price data",
    });

    // Grant Lambda permission to read the secret
    props.cronSecret.grantRead(this.cronFunction);

    // IAM policy for Lambda to invoke API
    this.cronFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
        ],
        resources: ["*"],
      })
    );

    // EventBridge rule - Daily at 11:13 UTC (14:13 Turkey time)
    const rule = new events.Rule(this, "DailyCronRule", {
      schedule: events.Schedule.cron({
        minute: "45",
        hour: "11",
        day: "*",
        month: "*",
        year: "*",
      }),
      description: "Triggers daily cryptocurrency price data fetch",
    });

    // Add Lambda as target
    rule.addTarget(
      new targets.LambdaFunction(this.cronFunction, {
        retryAttempts: 2,
      })
    );

    // Outputs
    new cdk.CfnOutput(this, "CronFunctionArn", {
      value: this.cronFunction.functionArn,
      description: "ARN of the Lambda function",
      exportName: "CronFunctionArn",
    });

    new cdk.CfnOutput(this, "CronRuleArn", {
      value: rule.ruleArn,
      description: "ARN of the EventBridge rule",
      exportName: "CronRuleArn",
    });
  }
}
