import swaggerJSDoc from "swagger-jsdoc";
import { ENV } from "./env";

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Asisten+Stock AI — Hedge Fund & Wealth Management API",
      version: "2.0.0",
      description:
        "High-performance REST & Real-time WebSocket API for multi-asset portfolio management, automated technical analysis, AI copilot, FX tracking, and wealth goal planning.",
      contact: {
        name: "Asisten+Stock Support",
      },
    },
    servers: [
      {
        url: `http://localhost:${ENV.PORT}/api`,
        description: "Local Development Server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter your JWT token obtained from POST /auth/login",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./src/routes/*.ts", "./src/modules/**/*.routes.ts"],
};

export const swaggerSpec = swaggerJSDoc(options);
