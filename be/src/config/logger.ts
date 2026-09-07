import pino from "pino";
import { ENV } from "./env";

const isDev = ENV.NODE_ENV !== "production";

export const logger = pino({
  level: isDev ? "debug" : "info",
  transport: isDev
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:standard",
          ignore: "pid,hostname",
        },
      }
    : undefined,
  base: {
    env: ENV.NODE_ENV,
  },
});

export default logger;
