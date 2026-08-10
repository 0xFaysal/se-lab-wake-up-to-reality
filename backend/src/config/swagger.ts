import path from "node:path";
import swaggerJSDoc from "swagger-jsdoc";
import { openApiResponses, openApiSchemas } from "../docs/openapi.schemas.js";
import { openApiTags } from "../docs/openapi.tags.js";
import { env } from "./env.js";

const documentationGlob = (relativePath: string) =>
  path.join(process.cwd(), relativePath).replaceAll("\\", "/");

const serverUrl = env.API_PUBLIC_URL ?? `http://localhost:${env.PORT}`;

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "ParkEase BD API",
      version: "1.0.0",
      description: `
ParkEase BD backend REST API.

Main user roles:
- Driver
- Parking Owner
- Security Guard
- Admin

Authentication uses HttpOnly cookies containing short-lived access tokens and
rotating refresh tokens.

Important:
- Public registration is available only for DRIVER and PARKING_OWNER.
- GUARD accounts are created through controlled Owner/Admin flows.
- ADMIN accounts cannot be created through public registration.
      `.trim(),
      contact: {
        name: "ParkEase BD Development Team",
      },
    },
    servers: [
      {
        url: serverUrl,
        description:
          env.NODE_ENV === "production"
            ? "Production API"
            : "Local development API",
      },
    ],
    tags: [...openApiTags],
    components: {
      securitySchemes: {
        accessCookie: {
          type: "apiKey",
          in: "cookie",
          name: "access_token",
          description:
            "HttpOnly access-token cookie issued after registration, login, or refresh.",
        },
        refreshCookie: {
          type: "apiKey",
          in: "cookie",
          name: "refresh_token",
          description:
            "HttpOnly refresh-token cookie used by refresh and logout operations.",
        },
      },
      schemas: openApiSchemas,
      responses: openApiResponses,
    },
  },
  apis: [
    documentationGlob("src/app.ts"),
    documentationGlob("src/modules/**/*.routes.ts"),
    documentationGlob("dist/src/app.js"),
    documentationGlob("dist/src/modules/**/*.routes.js"),
  ],
};

export const swaggerSpec = swaggerJSDoc(options);
