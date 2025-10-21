import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";

const secretsClient = new SecretsManagerClient({});

interface LambdaEvent {
  // EventBridge passes various metadata
  [key: string]: any;
}

interface LambdaResponse {
  statusCode: number;
  body: string;
}

/**
 * Lambda handler for daily cron job
 * Fetches cryptocurrency price data by calling the API endpoint
 */
export const handler = async (event: LambdaEvent): Promise<LambdaResponse> => {
  console.log("Cron job triggered:", JSON.stringify(event, null, 2));

  const apiUrl = process.env.API_URL;
  const cronSecretArn = process.env.CRON_SECRET_ARN;

  if (!apiUrl) {
    console.error("API_URL environment variable not set");
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "API_URL not configured" }),
    };
  }

  if (!cronSecretArn) {
    console.error("CRON_SECRET_ARN environment variable not set");
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "CRON_SECRET_ARN not configured" }),
    };
  }

  try {
    // Get the cron secret from Secrets Manager
    console.log("Fetching cron secret from Secrets Manager...");
    const secretResponse = await secretsClient.send(
      new GetSecretValueCommand({
        SecretId: cronSecretArn,
      })
    );

    const cronSecret = secretResponse.SecretString;

    if (!cronSecret) {
      throw new Error("Cron secret is empty");
    }

    // Call the API endpoint
    const endpoint = `${apiUrl}/api/cron/fetch-data`;
    console.log(`Calling API endpoint: ${endpoint}`);

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cronSecret}`,
      },
    });

    const responseText = await response.text();
    console.log("API Response Status:", response.status);
    console.log("API Response Body:", responseText);

    if (!response.ok) {
      throw new Error(
        `API request failed with status ${response.status}: ${responseText}`
      );
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Cron job completed successfully",
        apiResponse: responseText,
        timestamp: new Date().toISOString(),
      }),
    };
  } catch (error) {
    console.error("Cron job failed:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Cron job failed",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      }),
    };
  }
};
