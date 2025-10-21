#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";

import { AmplifyStack } from "../lib/amplify-stack";
import { CronStack } from "../lib/cron-stack";
import { DatabaseStack } from "../lib/database-stack";
import { SecretsStack } from "../lib/secrets-stack";

const app = new cdk.App();

// Get environment from context or default to dev
const environment = app.node.tryGetContext("environment") || "dev";
const accountId = process.env.CDK_DEFAULT_ACCOUNT || process.env.AWS_ACCOUNT_ID;
const region = process.env.CDK_DEFAULT_REGION || "eu-central-1";

const env = {
  account: accountId,
  region,
};

// Stack 1: Secrets (deploy first - no dependencies)
const secretsStack = new SecretsStack(app, `hm-case-Secrets-${environment}`, {
  env,
  description: "Secrets Manager for API keys and credentials",
});

// Stack 2: Database (depends on secrets)
const databaseStack = new DatabaseStack(
  app,
  `hm-case-Database-${environment}`,
  {
    env,
    description: "RDS PostgreSQL database",
    dbSecret: secretsStack.dbSecret,
    coinGeckoSecret: secretsStack.coinGeckoSecret,
    jwtSecret: secretsStack.jwtSecret,
    cronSecret: secretsStack.cronSecret,
  }
);

// Stack 3: Amplify (depends on database)
const amplifyStack = new AmplifyStack(app, `hm-case-Amplify-${environment}`, {
  env,
  description: "AWS Amplify hosting for Next.js application",
  databaseUrl: databaseStack.databaseUrl,
  dbSecret: secretsStack.dbSecret,
  coinGeckoSecret: secretsStack.coinGeckoSecret,
  jwtSecret: secretsStack.jwtSecret,
  cronSecret: secretsStack.cronSecret,
});

// Stack 4: Cron Job (depends on amplify)
const _cronStack = new CronStack(app, `hm-case-Cron-${environment}`, {
  env,
  description: "EventBridge cron job for daily data fetching",
  amplifyAppUrl: amplifyStack.appUrl,
  cronSecret: secretsStack.cronSecret,
});

// Add tags to all stacks
cdk.Tags.of(app).add("Project", "hm-case");
cdk.Tags.of(app).add("Environment", environment);
cdk.Tags.of(app).add("ManagedBy", "CDK");
