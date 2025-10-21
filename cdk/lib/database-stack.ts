import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as rds from "aws-cdk-lib/aws-rds";
import type * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import type { Construct } from "constructs";

interface DatabaseStackProps extends cdk.StackProps {
  dbSecret: secretsmanager.ISecret;
  coinGeckoSecret: secretsmanager.ISecret;
  jwtSecret: secretsmanager.ISecret;
  cronSecret: secretsmanager.ISecret;
}

export class DatabaseStack extends cdk.Stack {
  public readonly database: rds.DatabaseInstance;
  public readonly databaseUrl: string;

  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id, props);

    // VPC for RDS (use default VPC to save costs)
    const vpc = ec2.Vpc.fromLookup(this, "DefaultVPC", {
      isDefault: true,
    });

    // Security Group for RDS
    const dbSecurityGroup = new ec2.SecurityGroup(
      this,
      "DatabaseSecurityGroup",
      {
        vpc,
        description: "Security group for RDS PostgreSQL",
        allowAllOutbound: true,
      }
    );

    // Allow inbound from anywhere (for Amplify to connect)
    // In production, you'd restrict this to specific IPs or security groups
    dbSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(5432),
      "Allow PostgreSQL access from anywhere"
    );

    // RDS PostgreSQL Instance
    this.database = new rds.DatabaseInstance(this, "Database", {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_15_4,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC, // Public subnet so Amplify can reach it
      },
      securityGroups: [dbSecurityGroup],
      databaseName: "crypto_dashboard",
      credentials: rds.Credentials.fromSecret(props.dbSecret),
      allocatedStorage: 20, // GB
      maxAllocatedStorage: 30, // Auto-scaling up to 30GB
      publiclyAccessible: true, // Required for Amplify
      removalPolicy: cdk.RemovalPolicy.DESTROY, // WARNING: Deletes DB when stack is destroyed
      deletionProtection: false, // Allow deletion
      backupRetention: cdk.Duration.days(7), // 7 days backup
      storageEncrypted: true,
    });

    // Construct DATABASE_URL
    const dbHost = this.database.dbInstanceEndpointAddress;
    const dbPort = this.database.dbInstanceEndpointPort;
    const dbName = "crypto_dashboard";
    const dbUser = props.dbSecret
      .secretValueFromJson("username")
      .unsafeUnwrap();
    const dbPassword = props.dbSecret
      .secretValueFromJson("password")
      .unsafeUnwrap();

    this.databaseUrl = `postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}?schema=public`;

    // Outputs
    new cdk.CfnOutput(this, "DatabaseEndpoint", {
      value: this.database.dbInstanceEndpointAddress,
      description: "RDS PostgreSQL endpoint",
      exportName: "DatabaseEndpoint",
    });

    new cdk.CfnOutput(this, "DatabasePort", {
      value: this.database.dbInstanceEndpointPort,
      description: "RDS PostgreSQL port",
      exportName: "DatabasePort",
    });

    new cdk.CfnOutput(this, "DatabaseName", {
      value: dbName,
      description: "Database name",
      exportName: "DatabaseName",
    });

    new cdk.CfnOutput(this, "DatabaseUrlOutput", {
      value: this.databaseUrl,
      description: "Complete DATABASE_URL connection string",
      exportName: "DatabaseUrl",
    });
  }
}
