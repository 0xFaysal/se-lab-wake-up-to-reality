export const openApiSchemas = {
  Meta: {
    type: "object",
    properties: {
      requestId: { type: "string", format: "uuid" },
      timestamp: { type: "string", format: "date-time" },
    },
    required: ["timestamp"],
  },
  Error: {
    type: "object",
    properties: {
      code: { type: "string", example: "AUTH_INVALID_CREDENTIALS" },
      message: { type: "string", example: "Invalid email/phone or password" },
      details: { type: "object", additionalProperties: true },
    },
    required: ["code", "message"],
  },
  ErrorResponse: {
    type: "object",
    properties: {
      success: { type: "boolean", enum: [false] },
      error: { $ref: "#/components/schemas/Error" },
      meta: { $ref: "#/components/schemas/Meta" },
    },
    required: ["success", "error", "meta"],
  },
  UserRole: {
    type: "string",
    enum: ["DRIVER", "PARKING_OWNER", "GUARD", "ADMIN"],
  },
  UserStatus: {
    type: "string",
    enum: ["PENDING", "ACTIVE", "SUSPENDED", "BLOCKED"],
  },
  AuthUser: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      fullName: { type: "string", example: "Demo User" },
      email: { type: "string", format: "email", example: "user@example.com" },
      phone: { type: "string", example: "+8801712345678" },
      roles: {
        type: "array",
        items: { $ref: "#/components/schemas/UserRole" },
      },
      status: { $ref: "#/components/schemas/UserStatus" },
      mustChangePassword: { type: "boolean" },
      emailVerified: { type: "boolean" },
      phoneVerified: { type: "boolean" },
    },
    required: [
      "id",
      "fullName",
      "email",
      "phone",
      "roles",
      "status",
      "mustChangePassword",
      "emailVerified",
      "phoneVerified",
    ],
  },
  AuthResponse: {
    type: "object",
    properties: {
      success: { type: "boolean", enum: [true] },
      data: {
        type: "object",
        properties: {
          user: { $ref: "#/components/schemas/AuthUser" },
          nextAction: {
            type: "string",
            nullable: true,
            enum: [
              "CHANGE_INITIAL_PASSWORD",
              "VERIFY_EMAIL",
              "VERIFY_PHONE",
              null,
            ],
          },
        },
        required: ["user", "nextAction"],
      },
      meta: { $ref: "#/components/schemas/Meta" },
    },
    required: ["success", "data", "meta"],
  },
  StrongPassword: {
    type: "string",
    format: "password",
    minLength: 12,
    maxLength: 128,
    pattern: "^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{12,128}$",
    example: "StrongPassword123!",
    writeOnly: true,
  },
  RegisterRequest: {
    type: "object",
    properties: {
      fullName: {
        type: "string",
        minLength: 2,
        maxLength: 120,
        example: "Driver Test",
      },
      email: {
        type: "string",
        format: "email",
        example: "driver@example.com",
      },
      phone: {
        type: "string",
        description:
          "Bangladesh mobile number. Stored canonically as +8801XXXXXXXXX.",
        example: "01712345678",
      },
      password: { $ref: "#/components/schemas/StrongPassword" },
      role: { type: "string", enum: ["DRIVER", "PARKING_OWNER"] },
      acceptTerms: { type: "boolean", enum: [true] },
      acceptPrivacyPolicy: { type: "boolean", enum: [true] },
    },
    required: [
      "fullName",
      "email",
      "phone",
      "password",
      "role",
      "acceptTerms",
      "acceptPrivacyPolicy",
    ],
  },
  LoginRequest: {
    type: "object",
    properties: {
      identifier: {
        type: "string",
        description: "Email or Bangladesh mobile number.",
        example: "01712345678",
      },
      password: { type: "string", format: "password", writeOnly: true },
      rememberDevice: {
        type: "boolean",
        default: false,
        description:
          "Use false for a one-day refresh session or true for a 30-day session.",
      },
    },
    required: ["identifier", "password"],
  },
  ChangePasswordRequest: {
    type: "object",
    properties: {
      currentPassword: { type: "string", format: "password", writeOnly: true },
      newPassword: { $ref: "#/components/schemas/StrongPassword" },
    },
    required: ["currentPassword", "newPassword"],
  },
  CreateGuardRequest: {
    type: "object",
    properties: {
      fullName: {
        type: "string",
        minLength: 2,
        maxLength: 120,
        example: "Parking Guard",
      },
      email: {
        type: "string",
        format: "email",
        example: "guard@example.com",
      },
      phone: {
        type: "string",
        description: "Bangladesh mobile number.",
        example: "01812345678",
      },
    },
    required: ["fullName", "email", "phone"],
  },
  GuardInvitationResponse: {
    type: "object",
    properties: {
      success: { type: "boolean", enum: [true] },
      data: {
        type: "object",
        properties: {
          user: { $ref: "#/components/schemas/AuthUser" },
          developmentSetupToken: {
            type: "string",
            description:
              "Returned only when EXPOSE_DEVELOPMENT_AUTH_CODES=true.",
          },
        },
        required: ["user"],
      },
      meta: { $ref: "#/components/schemas/Meta" },
    },
    required: ["success", "data", "meta"],
  },
  PasswordResetRequest: {
    type: "object",
    properties: {
      identifier: { type: "string", example: "user@example.com" },
    },
    required: ["identifier"],
  },
  ResetPasswordRequest: {
    type: "object",
    properties: {
      token: { type: "string", minLength: 32, maxLength: 200, writeOnly: true },
      newPassword: { $ref: "#/components/schemas/StrongPassword" },
    },
    required: ["token", "newPassword"],
  },
  VerificationCodeRequest: {
    type: "object",
    properties: {
      code: { type: "string", pattern: "^[0-9]{6}$", example: "582143" },
    },
    required: ["code"],
  },
  Session: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      userAgent: { type: "string", nullable: true },
      rememberDevice: { type: "boolean" },
      expiresAt: { type: "string", format: "date-time" },
      createdAt: { type: "string", format: "date-time" },
      current: { type: "boolean" },
    },
    required: ["id", "rememberDevice", "expiresAt", "createdAt", "current"],
  },
  ReadinessResponse: {
    type: "object",
    properties: {
      success: { type: "boolean" },
      data: {
        type: "object",
        properties: {
          status: { type: "string", enum: ["ready", "not_ready"] },
          checks: {
            type: "object",
            properties: {
              postgres: { type: "boolean" },
              redis: { type: "boolean" },
            },
            required: ["postgres", "redis"],
          },
        },
        required: ["status", "checks"],
      },
      meta: { $ref: "#/components/schemas/Meta" },
    },
    required: ["success", "data", "meta"],
  },
  MessageResponse: {
    type: "object",
    properties: {
      success: { type: "boolean", enum: [true] },
      data: {
        type: "object",
        properties: { message: { type: "string" } },
        required: ["message"],
      },
      meta: { $ref: "#/components/schemas/Meta" },
    },
    required: ["success", "data", "meta"],
  },
  PasswordResetAcceptedResponse: {
    type: "object",
    properties: {
      success: { type: "boolean", enum: [true] },
      data: {
        type: "object",
        properties: {
          message: { type: "string" },
          developmentResetToken: {
            type: "string",
            description:
              "Returned only when EXPOSE_DEVELOPMENT_AUTH_CODES=true.",
          },
        },
        required: ["message"],
      },
      meta: { $ref: "#/components/schemas/Meta" },
    },
    required: ["success", "data", "meta"],
  },
  VerificationRequestResponse: {
    type: "object",
    properties: {
      success: { type: "boolean", enum: [true] },
      data: {
        type: "object",
        properties: {
          alreadyVerified: { type: "boolean" },
          developmentCode: {
            type: "string",
            pattern: "^[0-9]{6}$",
            description:
              "Returned only when EXPOSE_DEVELOPMENT_AUTH_CODES=true.",
          },
        },
        required: ["alreadyVerified"],
      },
      meta: { $ref: "#/components/schemas/Meta" },
    },
    required: ["success", "data", "meta"],
  },
  VerificationConfirmedResponse: {
    type: "object",
    properties: {
      success: { type: "boolean", enum: [true] },
      data: {
        type: "object",
        properties: {
          verified: { type: "boolean", enum: [true] },
          channel: { type: "string", enum: ["email", "phone"] },
        },
        required: ["verified", "channel"],
      },
      meta: { $ref: "#/components/schemas/Meta" },
    },
    required: ["success", "data", "meta"],
  },
} as const;

export const openApiResponses = {
  BadRequest: {
    description: "Request validation failed.",
    content: {
      "application/json": {
        schema: { $ref: "#/components/schemas/ErrorResponse" },
      },
    },
  },
  Unauthorized: {
    description: "Authentication failed or is required.",
    content: {
      "application/json": {
        schema: { $ref: "#/components/schemas/ErrorResponse" },
      },
    },
  },
  Forbidden: {
    description: "The authenticated account cannot perform this action.",
    content: {
      "application/json": {
        schema: { $ref: "#/components/schemas/ErrorResponse" },
      },
    },
  },
  RateLimited: {
    description: "Rate limit exceeded.",
    headers: {
      "Retry-After": {
        schema: { type: "integer" },
        description: "Seconds until another request may be attempted.",
      },
    },
    content: {
      "application/json": {
        schema: { $ref: "#/components/schemas/ErrorResponse" },
      },
    },
  },
} as const;
