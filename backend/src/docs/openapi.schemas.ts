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
  VehicleType: {
    type: "string",
    enum: ["MOTORCYCLE", "SEDAN", "SUV", "MICROBUS"],
  },
  VehicleVerificationStatus: {
    type: "string",
    enum: ["DRAFT", "PENDING", "VERIFIED", "REJECTED", "SUSPENDED"],
  },
  Vehicle: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      vehicleType: { $ref: "#/components/schemas/VehicleType" },
      registrationNumber: {
        type: "string",
        example: "DHAKA METRO GA 12-3456",
      },
      brand: { type: "string", nullable: true, example: "Toyota" },
      model: { type: "string", nullable: true, example: "Axio" },
      color: { type: "string", nullable: true, example: "White" },
      heightCm: { type: "integer", nullable: true, example: 145 },
      widthCm: { type: "integer", nullable: true, example: 177 },
      lengthCm: { type: "integer", nullable: true, example: 440 },
      verificationStatus: {
        $ref: "#/components/schemas/VehicleVerificationStatus",
      },
      isDefault: { type: "boolean" },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
    required: [
      "id",
      "vehicleType",
      "registrationNumber",
      "brand",
      "model",
      "color",
      "heightCm",
      "widthCm",
      "lengthCm",
      "verificationStatus",
      "isDefault",
      "createdAt",
      "updatedAt",
    ],
  },
  CreateVehicleRequest: {
    type: "object",
    properties: {
      vehicleType: { $ref: "#/components/schemas/VehicleType" },
      registrationNumber: {
        type: "string",
        minLength: 4,
        maxLength: 50,
        example: "DHAKA METRO GA 12-3456",
      },
      brand: { type: "string", minLength: 1, maxLength: 80 },
      model: { type: "string", minLength: 1, maxLength: 80 },
      color: { type: "string", minLength: 1, maxLength: 40 },
      heightCm: { type: "integer", minimum: 1, maximum: 10000 },
      widthCm: { type: "integer", minimum: 1, maximum: 10000 },
      lengthCm: { type: "integer", minimum: 1, maximum: 10000 },
      isDefault: { type: "boolean", default: false },
    },
    required: ["vehicleType", "registrationNumber", "brand", "model", "color"],
  },
  UpdateVehicleRequest: {
    type: "object",
    minProperties: 1,
    properties: {
      vehicleType: { $ref: "#/components/schemas/VehicleType" },
      registrationNumber: { type: "string", minLength: 4, maxLength: 50 },
      brand: { type: "string", minLength: 1, maxLength: 80 },
      model: { type: "string", minLength: 1, maxLength: 80 },
      color: { type: "string", minLength: 1, maxLength: 40 },
      heightCm: {
        type: "integer",
        minimum: 1,
        maximum: 10000,
        nullable: true,
      },
      widthCm: {
        type: "integer",
        minimum: 1,
        maximum: 10000,
        nullable: true,
      },
      lengthCm: {
        type: "integer",
        minimum: 1,
        maximum: 10000,
        nullable: true,
      },
    },
  },
  VehicleResponse: {
    type: "object",
    properties: {
      success: { type: "boolean", enum: [true] },
      data: {
        type: "object",
        properties: { vehicle: { $ref: "#/components/schemas/Vehicle" } },
        required: ["vehicle"],
      },
      meta: { $ref: "#/components/schemas/Meta" },
    },
    required: ["success", "data", "meta"],
  },
  VehicleListResponse: {
    type: "object",
    properties: {
      success: { type: "boolean", enum: [true] },
      data: {
        type: "object",
        properties: {
          vehicles: {
            type: "array",
            items: { $ref: "#/components/schemas/Vehicle" },
          },
        },
        required: ["vehicles"],
      },
      meta: { $ref: "#/components/schemas/Meta" },
    },
    required: ["success", "data", "meta"],
  },
  PropertyStatus: {
    type: "string",
    enum: ["ACTIVE", "TEMPORARILY_CLOSED", "INACTIVE"],
  },
  PropertyVerificationStatus: {
    type: "string",
    enum: ["DRAFT", "PENDING", "VERIFIED", "REJECTED", "SUSPENDED"],
  },
  OwnerPropertySummary: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      name: { type: "string" },
      publicArea: { type: "string" },
      approximateAddress: { type: "string" },
      latitude: { type: "number", format: "double" },
      longitude: { type: "number", format: "double" },
      verificationStatus: {
        $ref: "#/components/schemas/PropertyVerificationStatus",
      },
      status: { $ref: "#/components/schemas/PropertyStatus" },
      rejectionReason: { type: "string", nullable: true },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
    required: [
      "id",
      "name",
      "publicArea",
      "approximateAddress",
      "latitude",
      "longitude",
      "verificationStatus",
      "status",
      "rejectionReason",
      "createdAt",
      "updatedAt",
    ],
  },
  OwnerPropertyDetail: {
    allOf: [
      { $ref: "#/components/schemas/OwnerPropertySummary" },
      {
        type: "object",
        properties: {
          exactAddress: { type: "string" },
          entranceLatitude: {
            type: "number",
            format: "double",
            nullable: true,
          },
          entranceLongitude: {
            type: "number",
            format: "double",
            nullable: true,
          },
          accessInstructions: { type: "string", nullable: true },
          verifiedAt: { type: "string", format: "date-time", nullable: true },
        },
        required: [
          "exactAddress",
          "entranceLatitude",
          "entranceLongitude",
          "accessInstructions",
          "verifiedAt",
        ],
      },
    ],
  },
  CreatePropertyRequest: {
    type: "object",
    additionalProperties: false,
    properties: {
      name: { type: "string", minLength: 3, maxLength: 120 },
      publicArea: { type: "string", minLength: 2, maxLength: 120 },
      approximateAddress: { type: "string", minLength: 5, maxLength: 255 },
      exactAddress: { type: "string", minLength: 5, maxLength: 500 },
      latitude: { type: "number", minimum: -90, maximum: 90 },
      longitude: { type: "number", minimum: -180, maximum: 180 },
      entranceLatitude: { type: "number", minimum: -90, maximum: 90 },
      entranceLongitude: { type: "number", minimum: -180, maximum: 180 },
      accessInstructions: { type: "string", minLength: 1, maxLength: 1000 },
    },
    required: [
      "name",
      "publicArea",
      "approximateAddress",
      "exactAddress",
      "latitude",
      "longitude",
    ],
  },
  UpdatePropertyRequest: {
    type: "object",
    additionalProperties: false,
    minProperties: 1,
    properties: {
      name: { type: "string", minLength: 3, maxLength: 120 },
      publicArea: { type: "string", minLength: 2, maxLength: 120 },
      approximateAddress: { type: "string", minLength: 5, maxLength: 255 },
      exactAddress: { type: "string", minLength: 5, maxLength: 500 },
      latitude: { type: "number", minimum: -90, maximum: 90 },
      longitude: { type: "number", minimum: -180, maximum: 180 },
      entranceLatitude: {
        type: "number",
        minimum: -90,
        maximum: 90,
        nullable: true,
      },
      entranceLongitude: {
        type: "number",
        minimum: -180,
        maximum: 180,
        nullable: true,
      },
      accessInstructions: {
        type: "string",
        minLength: 1,
        maxLength: 1000,
        nullable: true,
      },
    },
  },
  OwnerPropertyResponse: {
    type: "object",
    properties: {
      success: { type: "boolean", enum: [true] },
      data: {
        type: "object",
        properties: {
          property: { $ref: "#/components/schemas/OwnerPropertyDetail" },
        },
        required: ["property"],
      },
      meta: { $ref: "#/components/schemas/Meta" },
    },
    required: ["success", "data", "meta"],
  },
  OwnerPropertyListResponse: {
    type: "object",
    properties: {
      success: { type: "boolean", enum: [true] },
      data: {
        type: "object",
        properties: {
          properties: {
            type: "array",
            items: { $ref: "#/components/schemas/OwnerPropertySummary" },
          },
        },
        required: ["properties"],
      },
      meta: { $ref: "#/components/schemas/Meta" },
    },
    required: ["success", "data", "meta"],
  },
  PropertyImage: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      url: { type: "string", format: "uri" },
      mimeType: {
        type: "string",
        enum: ["image/jpeg", "image/png", "image/webp"],
      },
      sortOrder: { type: "integer", minimum: 0 },
      isCover: { type: "boolean" },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
    required: [
      "id",
      "url",
      "mimeType",
      "sortOrder",
      "isCover",
      "createdAt",
      "updatedAt",
    ],
  },
  PropertyImagesResponse: {
    type: "object",
    properties: {
      success: { type: "boolean", enum: [true] },
      data: {
        type: "object",
        properties: {
          images: {
            type: "array",
            items: { $ref: "#/components/schemas/PropertyImage" },
          },
        },
        required: ["images"],
      },
      meta: { $ref: "#/components/schemas/Meta" },
    },
    required: ["success", "data", "meta"],
  },
  PropertyImageReorderRequest: {
    type: "object",
    additionalProperties: false,
    properties: {
      imageIds: {
        type: "array",
        minItems: 1,
        maxItems: 10,
        uniqueItems: true,
        items: { type: "string", format: "uuid" },
      },
      coverImageId: { type: "string", format: "uuid" },
    },
    required: ["imageIds"],
  },
  AdminPropertyOwner: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      fullName: { type: "string" },
      email: { type: "string", format: "email" },
      phone: { type: "string" },
      status: { $ref: "#/components/schemas/UserStatus" },
      emailVerified: { type: "boolean" },
      phoneVerified: { type: "boolean" },
    },
    required: ["id", "fullName", "email", "phone", "status"],
  },
  AdminPropertySummary: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      name: { type: "string" },
      publicArea: { type: "string" },
      approximateAddress: { type: "string" },
      latitude: { type: "number", format: "double" },
      longitude: { type: "number", format: "double" },
      verificationStatus: {
        $ref: "#/components/schemas/PropertyVerificationStatus",
      },
      status: { $ref: "#/components/schemas/PropertyStatus" },
      rejectionReason: { type: "string", nullable: true },
      imageCount: { type: "integer", minimum: 0 },
      owner: { $ref: "#/components/schemas/AdminPropertyOwner" },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
    required: [
      "id",
      "name",
      "publicArea",
      "approximateAddress",
      "latitude",
      "longitude",
      "verificationStatus",
      "status",
      "rejectionReason",
      "imageCount",
      "owner",
      "createdAt",
      "updatedAt",
    ],
  },
  AdminPropertyDetail: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      name: { type: "string" },
      description: { type: "string", nullable: true },
      publicArea: { type: "string" },
      approximateAddress: { type: "string" },
      exactAddress: { type: "string" },
      latitude: { type: "number", format: "double" },
      longitude: { type: "number", format: "double" },
      entranceLatitude: {
        type: "number",
        format: "double",
        nullable: true,
      },
      entranceLongitude: {
        type: "number",
        format: "double",
        nullable: true,
      },
      accessInstructions: { type: "string", nullable: true },
      verificationStatus: {
        $ref: "#/components/schemas/PropertyVerificationStatus",
      },
      status: { $ref: "#/components/schemas/PropertyStatus" },
      verifiedAt: { type: "string", format: "date-time", nullable: true },
      rejectionReason: { type: "string", nullable: true },
      reviewedBy: {
        type: "object",
        nullable: true,
        additionalProperties: true,
      },
      owner: { $ref: "#/components/schemas/AdminPropertyOwner" },
      images: {
        type: "array",
        items: { $ref: "#/components/schemas/PropertyImage" },
      },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
    required: [
      "id",
      "name",
      "description",
      "publicArea",
      "approximateAddress",
      "exactAddress",
      "latitude",
      "longitude",
      "entranceLatitude",
      "entranceLongitude",
      "accessInstructions",
      "verificationStatus",
      "status",
      "verifiedAt",
      "rejectionReason",
      "reviewedBy",
      "owner",
      "images",
      "createdAt",
      "updatedAt",
    ],
  },
  PropertyVerificationRequest: {
    oneOf: [
      {
        type: "object",
        additionalProperties: false,
        properties: { decision: { type: "string", enum: ["APPROVE"] } },
        required: ["decision"],
      },
      {
        type: "object",
        additionalProperties: false,
        properties: {
          decision: { type: "string", enum: ["REJECT"] },
          reason: { type: "string", minLength: 10, maxLength: 500 },
        },
        required: ["decision", "reason"],
      },
    ],
    discriminator: { propertyName: "decision" },
  },
  PropertyVerificationResult: {
    type: "object",
    properties: {
      propertyId: { type: "string", format: "uuid" },
      verificationStatus: {
        $ref: "#/components/schemas/PropertyVerificationStatus",
      },
      status: { $ref: "#/components/schemas/PropertyStatus" },
      reviewedByAdminId: { type: "string", format: "uuid" },
      verifiedAt: { type: "string", format: "date-time", nullable: true },
      rejectionReason: { type: "string", nullable: true },
      updatedAt: { type: "string", format: "date-time" },
    },
    required: [
      "propertyId",
      "verificationStatus",
      "status",
      "reviewedByAdminId",
      "verifiedAt",
      "rejectionReason",
      "updatedAt",
    ],
  },
  AdminPendingPropertiesResponse: {
    type: "object",
    properties: {
      success: { type: "boolean", enum: [true] },
      data: {
        type: "object",
        properties: {
          properties: {
            type: "array",
            items: { $ref: "#/components/schemas/AdminPropertySummary" },
          },
          pagination: {
            type: "object",
            properties: {
              page: { type: "integer", minimum: 1 },
              limit: { type: "integer", minimum: 1, maximum: 100 },
              total: { type: "integer", minimum: 0 },
              totalPages: { type: "integer", minimum: 0 },
            },
            required: ["page", "limit", "total", "totalPages"],
          },
        },
        required: ["properties", "pagination"],
      },
      meta: { $ref: "#/components/schemas/Meta" },
    },
    required: ["success", "data", "meta"],
  },
  AdminPropertyResponse: {
    type: "object",
    properties: {
      success: { type: "boolean", enum: [true] },
      data: {
        type: "object",
        properties: {
          property: { $ref: "#/components/schemas/AdminPropertyDetail" },
        },
        required: ["property"],
      },
      meta: { $ref: "#/components/schemas/Meta" },
    },
    required: ["success", "data", "meta"],
  },
  PropertyVerificationResponse: {
    type: "object",
    properties: {
      success: { type: "boolean", enum: [true] },
      data: {
        type: "object",
        properties: {
          verification: {
            $ref: "#/components/schemas/PropertyVerificationResult",
          },
        },
        required: ["verification"],
      },
      meta: { $ref: "#/components/schemas/Meta" },
    },
    required: ["success", "data", "meta"],
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
