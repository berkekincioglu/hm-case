import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";
import axios from "axios";

const secretsClient = new SecretsManagerClient({});

interface LambdaResponse {
  statusCode: number;
  body: string;
}

/**
 * Simple Lambda handler that calls the API endpoint to trigger data fetch
 * The API handles all the database logic - Lambda just triggers it
 */
export const handler = async (): Promise<LambdaResponse> => {
  const apiUrl = process.env.API_URL;
  const cronSecretArn = process.env.CRON_SECRET_ARN;

  if (!apiUrl || !cronSecretArn) {
    console.error("Missing environment variables");
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Configuration error" }),
    };
  }

  try {
    // Get the cron secret from Secrets Manager
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

    const response = await axios.post(
      endpoint,
      {},
      {
        headers: {
          Authorization: `Bearer ${cronSecret}`,
        },
        timeout: 290000, // 4 minutes 50 seconds (Lambda has 5 min timeout)
      }
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: "Cron job completed",
        apiResponse: response.data,
        timestamp: new Date().toISOString(),
      }),
    };
  } catch (error) {
    console.error("Cron job failed:", error);

    const errorMessage = axios.isAxiosError(error)
      ? `API error: ${error.response?.status} - ${error.response?.statusText}`
      : error instanceof Error
      ? error.message
      : "Unknown error";

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Cron job failed",
        message: errorMessage,
        timestamp: new Date().toISOString(),
      }),
    };
  }
};
