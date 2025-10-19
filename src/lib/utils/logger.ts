type LogLevel = "info" | "warn" | "error" | "success";

const colors = {
  info: "\x1b[36m", // Cyan
  warn: "\x1b[33m", // Yellow
  error: "\x1b[31m", // Red
  success: "\x1b[32m", // Green
  reset: "\x1b[0m",
};

class Logger {
  private log(level: LogLevel, message: string, data?: unknown) {
    const timestamp = new Date().toISOString();
    const color = colors[level];
    const prefix = `${color}[${level.toUpperCase()}]${
      colors.reset
    } ${timestamp}`;

    // eslint-disable-next-line no-console
    console.log(`${prefix} - ${message}`);
    if (data) {
      // eslint-disable-next-line no-console
      console.log(JSON.stringify(data, null, 2));
    }
  }

  info(message: string, data?: unknown) {
    this.log("info", message, data);
  }

  warn(message: string, data?: unknown) {
    this.log("warn", message, data);
  }

  error(message: string, error?: unknown) {
    this.log("error", message, error);
    if (error && typeof error === "object" && "stack" in error) {
      console.error(error.stack);
    }
  }

  success(message: string, data?: unknown) {
    this.log("success", message, data);
  }
}

export const logger = new Logger();
