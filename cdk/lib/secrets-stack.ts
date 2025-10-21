import * as cdk from "aws-cdk-lib";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import type { Construct } from "constructs";

export class SecretsStack extends cdk.Stack {
  public readonly coinGeckoSecret: secretsmanager.ISecret;
  public readonly jwtSecret: secretsmanager.ISecret;
  public readonly cronSecret: secretsmanager.ISecret;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // CoinGecko API Key secret
    this.coinGeckoSecret = new secretsmanager.Secret(this, "CoinGeckoSecret", {
      secretName: "crypto-dashboard/coingecko-api-key",
      description: "CoinGecko API key",
      secretStringValue: cdk.SecretValue.unsafePlainText(
        "PLACEHOLDER_CHANGE_AFTER_DEPLOY"
      ),
    });

    // JWT Secret
    this.jwtSecret = new secretsmanager.Secret(this, "JWTSecret", {
      secretName: "crypto-dashboard/jwt-secret",
      description: "JWT signing secret",
      generateSecretString: {
        excludePunctuation: true,
        includeSpace: false,
        passwordLength: 64,
      },
    });

    // Cron Secret
    this.cronSecret = new secretsmanager.Secret(this, "CronSecret", {
      secretName: "crypto-dashboard/cron-secret",
      description: "Secret for authenticating cron job requests",
      generateSecretString: {
        excludePunctuation: true,
        includeSpace: false,
        passwordLength: 64,
      },
    });

    // Outputs (without exportName to avoid circular dependencies)
    new cdk.CfnOutput(this, "CoinGeckoSecretArn", {
      value: this.coinGeckoSecret.secretArn,
      description: "ARN of the CoinGecko API key secret",
    });

    new cdk.CfnOutput(this, "JWTSecretArn", {
      value: this.jwtSecret.secretArn,
      description: "ARN of the JWT secret",
    });

    new cdk.CfnOutput(this, "CronSecretArn", {
      value: this.cronSecret.secretArn,
      description: "ARN of the cron secret",
    });
  }
}
