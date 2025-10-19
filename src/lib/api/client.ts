import axios from "axios";

/**
 * Axios client for API requests
 * Configured with base URL and default headers
 */
export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "/api",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000, // 30 seconds
});

// Request interceptor for logging (development only)
if (process.env.NODE_ENV === "development") {
  apiClient.interceptors.request.use((config) => {
    // Log API requests in development
    return config;
  });
}

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with error status
      console.error("API Error:", {
        status: error.response.status,
        data: error.response.data,
        url: error.config?.url,
      });
    } else if (error.request) {
      // Request was made but no response
      console.error("Network Error: No response received");
    } else {
      // Error in request configuration
      console.error("Request Error:", error.message);
    }
    return Promise.reject(error);
  }
);
