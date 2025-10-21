import * as cdk from "aws-cdk-lib";
import * as amplify from "aws-cdk-lib/aws-amplify";
import type * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import type { Construct } from "constructs";

interface AmplifyStackProps extends cdk.StackProps {
  databaseUrl: string;
  dbSecret: secretsmanager.ISecret;
  coinGeckoSecret: secretsmanager.ISecret;
  jwtSecret: secretsmanager.ISecret;
  cronSecret: secretsmanager.ISecret;
}

export class AmplifyStack extends cdk.Stack {
  public readonly app: amplify.CfnApp;
  public readonly appUrl: string;

  constructor(scope: Construct, id: string, props: AmplifyStackProps) {
    super(scope, id, props);

    // GitHub repository details
    // TODO: Replace with your actual values
    const githubOwner = "berkekincioglu";
    const githubRepo = "hm-case";
    const githubBranch = "main";

    // GitHub token must be stored in Secrets Manager
    // Create this manually: aws secretsmanager create-secret --name crypto-dashboard/github-token --secret-string "your_github_pat"
    const githubToken = cdk.SecretValue.secretsManager(
      "crypto-dashboard/github-token"
    );

    // Create Amplify App
    this.app = new amplify.CfnApp(this, "AmplifyApp", {
      name: "crypto-dashboard",
      repository: `https://github.com/${githubOwner}/${githubRepo}`,
      accessToken: githubToken.unsafeUnwrap(),

      // Build settings for Next.js
      buildSpec: JSON.stringify({
        version: 1,
        frontend: {
          phases: {
            preBuild: {
              commands: [
                "npm ci",
                "npx prisma generate",
                "npx prisma migrate deploy",
              ],
            },
            build: {
              commands: ["npm run build"],
            },
          },
          artifacts: {
            baseDirectory: ".next",
            files: ["**/*"],
          },
          cache: {
            paths: ["node_modules/**/*", ".next/cache/**/*"],
          },
        },
      }),

      // Environment variables
      environmentVariables: [
        {
          name: "DATABASE_URL",
          value: props.databaseUrl,
        },
        {
          name: "COINGECKO_API_KEY",
          value: props.coinGeckoSecret.secretValue.unsafeUnwrap(),
        },
        {
          name: "COINGECKO_BASE_URL",
          value: "https://api.coingecko.com/api/v3",
        },
        {
          name: "JWT_SECRET",
          value: props.jwtSecret.secretValue.unsafeUnwrap(),
        },
        {
          name: "CRON_SECRET",
          value: props.cronSecret.secretValue.unsafeUnwrap(),
        },
        {
          name: "AUTH_USERNAME",
          value: "admin",
        },
        {
          name: "AUTH_PASSWORD",
          value: "admin123",
        },
        {
          name: "NODE_ENV",
          value: "production",
        },
        {
          name: "NEXT_PUBLIC_API_URL",
          value: "/api",
        },
        {
          name: "AMPLIFY_MONOREPO_APP_ROOT",
          value: ".",
        },
        {
          name: "AMPLIFY_DIFF_DEPLOY",
          value: "false",
        },
        {
          name: "_LIVE_UPDATES",
          value:
            '[{"name":"Next.js version","pkg":"next","type":"npm","version":"latest"}]',
        },
      ],

      // Enable auto branch creation
      enableBranchAutoDeletion: true,

      // IAM service role (Amplify needs this to access resources)
      iamServiceRole: undefined, // Amplify will create default role
    });

    // Create main branch
    const _mainBranch = new amplify.CfnBranch(this, "MainBranch", {
      appId: this.app.attrAppId,
      branchName: githubBranch,
      enableAutoBuild: true,
      enablePullRequestPreview: false,
      stage: "PRODUCTION",
    });

    // Construct app URL
    this.appUrl = `https://${githubBranch}.${this.app.attrDefaultDomain}`;

    // Outputs
    new cdk.CfnOutput(this, "AmplifyAppId", {
      value: this.app.attrAppId,
      description: "Amplify App ID",
      exportName: "AmplifyAppId",
    });

    new cdk.CfnOutput(this, "AmplifyAppUrl", {
      value: this.appUrl,
      description: "Amplify App URL",
      exportName: "AmplifyAppUrl",
    });

    new cdk.CfnOutput(this, "AmplifyConsoleUrl", {
      value: `https://console.aws.amazon.com/amplify/home?region=${this.region}#/${this.app.attrAppId}`,
      description: "Amplify Console URL",
    });
  }
}
