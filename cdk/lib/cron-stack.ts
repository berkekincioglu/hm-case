import { execSync } from "child_process";
import * as path from "path";

import * as cdk from "aws-cdk-lib";
import * as events from "aws-cdk-lib/aws-events";
import * as targets from "aws-cdk-lib/aws-events-targets";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import type * as rds from "aws-cdk-lib/aws-rds";
import type * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import type { Construct } from "constructs";

interface CronStackProps extends cdk.StackProps {
  database: rds.IDatabaseInstance;
  dbSecret: secretsmanager.ISecret;
  coinGeckoSecret: secretsmanager.ISecret;
}

export class CronStack extends cdk.Stack {
  public readonly cronFunction: lambda.Function;

  constructor(scope: Construct, id: string, props: CronStackProps) {
    super(scope, id, props);

    const lambdaPath = path.join(__dirname, "../../lambda/fetch-data");

    // Build Lambda function with esbuild
    execSync("npm run build", { cwd: lambdaPath, stdio: "inherit" });

    // Get database connection details
    const dbEndpoint = props.database.dbInstanceEndpointAddress;
    const dbPort = props.database.dbInstanceEndpointPort;
    const dbName = "crypto_dashboard";

    // Lambda function that directly fetches from CoinGecko and writes to database
    // Clean TypeScript implementation with proper structure
    this.cronFunction = new lambda.Function(this, "FetchDataFunction", {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset(path.join(lambdaPath, "dist")),
      timeout: cdk.Duration.minutes(5),
      memorySize: 512,
      environment: {
        COINGECKO_SECRET_ARN: props.coinGeckoSecret.secretArn,
        DB_SECRET_ARN: props.dbSecret.secretArn,
        DB_HOST: dbEndpoint,
        DB_PORT: dbPort,
        DB_NAME: dbName,
      },
      description: "Daily cron job to fetch cryptocurrency price data",
    });

    // Grant Lambda permission to read secrets
    props.coinGeckoSecret.grantRead(this.cronFunction);
    props.dbSecret.grantRead(this.cronFunction);

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

    // EventBridge rule - Daily at 11:50 UTC (14:50 Turkey time)
    const rule = new events.Rule(this, "DailyCronRule", {
      schedule: events.Schedule.cron({
        minute: "0",
        hour: "0",
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
