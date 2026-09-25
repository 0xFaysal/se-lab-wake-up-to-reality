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
    enum: ["DRIVER", "PROVIDER", "MANAGER", "GUARD", "ADMIN"],
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
      phoneVerified: {
        type: "boolean",
        description:
          "Whether the optional phone verification has been completed.",
      },
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
            enum: ["CHANGE_INITIAL_PASSWORD", "VERIFY_EMAIL", null],
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
      role: {
        type: "string",
        enum: ["DRIVER", "PROVIDER", "PARKING_OWNER"],
        description: "PARKING_OWNER is a deprecated compatibility alias for PROVIDER.",
      },
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
      version: { type: "integer", minimum: 1 },
      governanceMode: {
        allOf: [{ $ref: "#/components/schemas/PropertyGovernanceMode" }],
        nullable: true,
      },
      providerMembership: {
        allOf: [{ $ref: "#/components/schemas/PropertyProviderMembership" }],
        nullable: true,
      },
      isSoleController: { type: "boolean" },
      buildingManager: {
        allOf: [{ $ref: "#/components/schemas/BuildingManagerSummary" }],
        nullable: true,
      },
      canonicalPropertyId: { type: "string", format: "uuid", nullable: true },
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
      "version",
      "governanceMode",
      "providerMembership",
      "isSoleController",
      "buildingManager",
      "canonicalPropertyId",
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
          visitorIdentificationRequired: { type: "boolean" },
          vehicleHeightLimitCm: { type: "integer", nullable: true },
          entryCutoffLocalTime: { type: "string", nullable: true, example: "22:00" },
          generalParkingRules: { type: "string", nullable: true },
          commonSafetyRules: { type: "string", nullable: true },
          temporaryClosureReason: { type: "string", nullable: true },
          temporaryClosedAt: { type: "string", format: "date-time", nullable: true },
          temporaryClosedUntil: { type: "string", format: "date-time", nullable: true },
          verifiedAt: { type: "string", format: "date-time", nullable: true },
        },
        required: [
          "exactAddress",
          "entranceLatitude",
          "entranceLongitude",
          "accessInstructions",
          "visitorIdentificationRequired",
          "vehicleHeightLimitCm",
          "entryCutoffLocalTime",
          "generalParkingRules",
          "commonSafetyRules",
          "temporaryClosureReason",
          "temporaryClosedAt",
          "temporaryClosedUntil",
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
      visitorIdentificationRequired: { type: "boolean" },
      vehicleHeightLimitCm: { type: "integer", minimum: 1, maximum: 1000 },
      entryCutoffLocalTime: { type: "string", pattern: "^(?:[01]\\d|2[0-3]):[0-5]\\d$" },
      generalParkingRules: { type: "string", minLength: 1, maxLength: 2000 },
      commonSafetyRules: { type: "string", minLength: 1, maxLength: 2000 },
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
      visitorIdentificationRequired: { type: "boolean" },
      vehicleHeightLimitCm: { type: "integer", minimum: 1, maximum: 1000, nullable: true },
      entryCutoffLocalTime: {
        type: "string",
        pattern: "^(?:[01]\\d|2[0-3]):[0-5]\\d$",
        nullable: true,
      },
      generalParkingRules: { type: "string", minLength: 1, maxLength: 2000, nullable: true },
      commonSafetyRules: { type: "string", minLength: 1, maxLength: 2000, nullable: true },
      version: { type: "integer", minimum: 1 },
    },
    required: ["version"],
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
  PropertyGovernanceMode: {
    type: "string",
    enum: ["SINGLE_PROVIDER", "MULTI_PROVIDER"],
    description: "Derived from the number of active verified Provider memberships.",
  },
  PropertyProviderStatus: {
    type: "string",
    enum: ["PENDING", "ACTIVE", "SUSPENDED", "ENDED"],
  },
  PropertyProviderMembership: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      propertyId: { type: "string", format: "uuid" },
      providerUserId: { type: "string", format: "uuid" },
      status: { $ref: "#/components/schemas/PropertyProviderStatus" },
      verificationStatus: {
        $ref: "#/components/schemas/PropertyVerificationStatus",
      },
      joinedAt: { type: "string", format: "date-time" },
      verifiedAt: { type: "string", format: "date-time", nullable: true },
      rejectionReason: { type: "string", nullable: true },
      endedAt: { type: "string", format: "date-time", nullable: true },
    },
    required: ["id", "status", "verificationStatus", "joinedAt", "verifiedAt"],
  },
  BuildingManagerAssignmentStatus: {
    type: "string",
    enum: ["PENDING_APPROVAL", "ACTIVE", "REJECTED", "ENDED", "CANCELLED", "PENDING_RECONFIRMATION"],
  },
  BuildingManagerSummary: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      status: { $ref: "#/components/schemas/BuildingManagerAssignmentStatus" },
      candidate: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          fullName: { type: "string" },
        },
        required: ["id", "fullName"],
      },
    },
    required: ["id", "status", "candidate"],
  },
  PropertyBuildingManagerAssignment: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      propertyId: { type: "string", format: "uuid" },
      status: { $ref: "#/components/schemas/BuildingManagerAssignmentStatus" },
      candidate: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          fullName: { type: "string" },
        },
        required: ["id"],
      },
      votes: {
        type: "array",
        items: { $ref: "#/components/schemas/GovernanceVote" },
      },
      nominatedAt: { type: "string", format: "date-time" },
      activatedAt: { type: "string", format: "date-time", nullable: true },
      endedAt: { type: "string", format: "date-time", nullable: true },
    },
    required: ["id", "propertyId", "status", "candidate", "nominatedAt", "activatedAt", "endedAt"],
  },
  GovernanceVote: {
    type: "object",
    properties: {
      providerMembershipId: { type: "string", format: "uuid" },
      voterUserId: { type: "string", format: "uuid" },
      decision: { type: "string", enum: ["APPROVE", "REJECT"] },
      reason: { type: "string", nullable: true },
      createdAt: { type: "string", format: "date-time" },
    },
    required: ["providerMembershipId", "voterUserId", "decision", "reason", "createdAt"],
  },
  GovernanceVoteRequest: {
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
          reason: { type: "string", minLength: 5, maxLength: 500 },
        },
        required: ["decision", "reason"],
      },
    ],
    discriminator: { propertyName: "decision" },
  },
  BuildingManagerNominationRequest: {
    type: "object",
    additionalProperties: false,
    properties: { candidateUserId: { type: "string", format: "uuid" } },
    required: ["candidateUserId"],
  },
  CommonPropertyRulesUpdateRequest: {
    type: "object",
    additionalProperties: false,
    properties: {
      version: { type: "integer", minimum: 1 },
      accessInstructions: { type: "string", nullable: true, maxLength: 1000 },
      visitorIdentificationRequired: { type: "boolean" },
      vehicleHeightLimitCm: { type: "integer", minimum: 1, maximum: 1000, nullable: true },
      entryCutoffLocalTime: { type: "string", nullable: true, example: "22:00" },
      generalParkingRules: { type: "string", nullable: true, maxLength: 2000 },
      commonSafetyRules: { type: "string", nullable: true, maxLength: 2000 },
    },
    required: ["version"],
  },
  TemporaryClosureUpdateRequest: {
    oneOf: [
      {
        type: "object",
        additionalProperties: false,
        properties: {
          action: { type: "string", enum: ["CLOSE"] },
          version: { type: "integer", minimum: 1 },
          reason: { type: "string", minLength: 5, maxLength: 500 },
          until: { type: "string", format: "date-time" },
        },
        required: ["action", "version", "reason"],
      },
      {
        type: "object",
        additionalProperties: false,
        properties: {
          action: { type: "string", enum: ["REOPEN"] },
          version: { type: "integer", minimum: 1 },
        },
        required: ["action", "version"],
      },
    ],
    discriminator: { propertyName: "action" },
  },
  PropertyChangeProposalRequest: {
    oneOf: [
      {
        type: "object",
        additionalProperties: false,
        properties: {
          changeType: { type: "string", enum: ["COMMON_RULES"] },
          baseVersion: { type: "integer", minimum: 1 },
          changes: {
            type: "object",
            additionalProperties: false,
            minProperties: 1,
            properties: {
              accessInstructions: { type: "string", nullable: true, maxLength: 1000 },
              visitorIdentificationRequired: { type: "boolean" },
              vehicleHeightLimitCm: { type: "integer", minimum: 1, maximum: 1000, nullable: true },
              entryCutoffLocalTime: { type: "string", nullable: true, example: "22:00" },
              generalParkingRules: { type: "string", nullable: true, maxLength: 2000 },
              commonSafetyRules: { type: "string", nullable: true, maxLength: 2000 },
            },
          },
        },
        required: ["changeType", "baseVersion", "changes"],
      },
      {
        type: "object",
        additionalProperties: false,
        properties: {
          changeType: { type: "string", enum: ["IDENTITY_LOCATION"] },
          baseVersion: { type: "integer", minimum: 1 },
          changes: {
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
              entranceLatitude: { type: "number", minimum: -90, maximum: 90, nullable: true },
              entranceLongitude: { type: "number", minimum: -180, maximum: 180, nullable: true },
            },
          },
        },
        required: ["changeType", "baseVersion", "changes"],
      },
    ],
    discriminator: { propertyName: "changeType" },
  },
  PropertyChangeProposal: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      propertyId: { type: "string", format: "uuid" },
      proposedByUserId: { type: "string", format: "uuid" },
      basePropertyVersion: { type: "integer", minimum: 1 },
      changeType: {
        type: "string",
        enum: ["COMMON_RULES", "IDENTITY_LOCATION", "TEMPORARY_CLOSURE"],
        description:
          "TEMPORARY_CLOSURE can appear only on historical records; new proposals accept common-rule or identity/location changes.",
      },
      proposedChanges: { type: "object", additionalProperties: true },
      status: { type: "string", enum: ["PENDING_APPROVAL", "APPROVED", "APPLIED", "REJECTED", "CANCELLED", "STALE"] },
      votes: {
        type: "array",
        items: { $ref: "#/components/schemas/GovernanceVote" },
      },
      resolvedAt: { type: "string", format: "date-time", nullable: true },
      appliedAt: { type: "string", format: "date-time", nullable: true },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
    required: ["id", "propertyId", "proposedByUserId", "basePropertyVersion", "changeType", "proposedChanges", "status", "resolvedAt", "appliedAt", "createdAt", "updatedAt"],
  },
  AdminPropertyMergeRequest: {
    type: "object",
    additionalProperties: false,
    properties: {
      canonicalPropertyId: { type: "string", format: "uuid" },
      canonicalVersion: { type: "integer", minimum: 1 },
      duplicateVersion: { type: "integer", minimum: 1 },
      reason: { type: "string", minLength: 10, maxLength: 500 },
    },
    required: ["canonicalPropertyId", "canonicalVersion", "duplicateVersion", "reason"],
  },
  ManagerDelegationStatus: {
    type: "string",
    enum: ["PENDING_ACCEPTANCE", "ACTIVE", "SUSPENDED", "ENDED", "CANCELLED"],
  },
  ManagerDelegationPermission: {
    type: "string",
    enum: [
      "RESOURCE_VIEW", "LISTING_VIEW", "LISTING_MANAGE", "PRICE_MANAGE",
      "AVAILABILITY_MANAGE", "BOOKING_VIEW", "BOOKING_MANAGE", "IMAGE_MANAGE",
      "GUARD_VIEW", "GUARD_ADD_TO_PROPERTY", "GUARD_ASSIGN", "EARNINGS_VIEW", "REPORTS_VIEW",
    ],
  },
  PropertyGuardMembershipStatus: {
    type: "string",
    enum: ["PENDING_ACCEPTANCE", "ACTIVE", "SUSPENDED", "ENDED", "CANCELLED"],
  },
  PropertyGuardMembership: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      status: { $ref: "#/components/schemas/PropertyGuardMembershipStatus" },
      property: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" },
          publicArea: { type: "string" },
        },
        required: ["id", "name", "publicArea"],
      },
      guard: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          fullName: { type: "string" },
          emailMasked: { type: "string" },
          phoneMasked: { type: "string" },
        },
        required: ["id", "fullName", "emailMasked", "phoneMasked"],
      },
      invitedAt: { type: "string", format: "date-time" },
      joinedAt: { type: "string", format: "date-time", nullable: true },
      endedAt: { type: "string", format: "date-time", nullable: true },
    },
    required: ["id", "status", "property", "guard", "invitedAt", "joinedAt", "endedAt"],
  },
  PropertyGuardMembershipResponse: {
    type: "object",
    properties: {
      success: { type: "boolean", enum: [true] },
      data: {
        type: "object",
        properties: {
          membership: { $ref: "#/components/schemas/PropertyGuardMembership" },
        },
        required: ["membership"],
      },
      meta: { $ref: "#/components/schemas/Meta" },
    },
    required: ["success", "data", "meta"],
  },
  ProviderPropertySummary: {
    allOf: [{ $ref: "#/components/schemas/OwnerPropertySummary" }],
  },
  ProviderPropertyDetail: {
    allOf: [{ $ref: "#/components/schemas/OwnerPropertyDetail" }],
  },
  ProviderPropertyResponse: {
    type: "object",
    properties: {
      success: { type: "boolean", enum: [true] },
      data: {
        type: "object",
        properties: {
          property: { $ref: "#/components/schemas/ProviderPropertyDetail" },
        },
        required: ["property"],
      },
      meta: { $ref: "#/components/schemas/Meta" },
    },
    required: ["success", "data", "meta"],
  },
  ProviderPropertyListResponse: {
    type: "object",
    properties: {
      success: { type: "boolean", enum: [true] },
      data: {
        type: "object",
        properties: {
          properties: {
            type: "array",
            items: { $ref: "#/components/schemas/ProviderPropertySummary" },
          },
        },
        required: ["properties"],
      },
      meta: { $ref: "#/components/schemas/Meta" },
    },
    required: ["success", "data", "meta"],
  },
  ManagerDelegation: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      property: { type: "object", additionalProperties: true },
      providerMembershipId: { type: "string", format: "uuid" },
      provider: { type: "object", additionalProperties: true },
      manager: { type: "object", additionalProperties: true },
      status: { $ref: "#/components/schemas/ManagerDelegationStatus" },
      permissions: { type: "array", uniqueItems: true, items: { $ref: "#/components/schemas/ManagerDelegationPermission" } },
      resourceIds: { type: "array", uniqueItems: true, items: { type: "string", format: "uuid" } },
      validFrom: { type: "string", format: "date-time", nullable: true },
      validUntil: { type: "string", format: "date-time", nullable: true },
    },
    required: ["id", "property", "providerMembershipId", "provider", "manager", "status", "permissions", "resourceIds"],
  },
  GuardAssignmentStatus: {
    type: "string",
    enum: ["PENDING_ACCEPTANCE", "ACTIVE", "SUSPENDED", "ENDED", "CANCELLED"],
  },
  ProviderGuardAssignment: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      status: { $ref: "#/components/schemas/GuardAssignmentStatus" },
      property: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" },
          publicArea: { type: "string" },
        },
        required: ["id", "name", "publicArea"],
      },
      providerMembershipId: { type: "string", format: "uuid" },
      provider: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          fullName: { type: "string" },
        },
        required: ["id", "fullName"],
      },
      guardMembershipId: { type: "string", format: "uuid" },
      guard: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          fullName: { type: "string" },
          emailMasked: { type: "string" },
          phoneMasked: { type: "string" },
        },
        required: ["id", "fullName", "emailMasked", "phoneMasked"],
      },
      shiftStart: { type: "string", nullable: true, example: "08:00" },
      shiftEnd: { type: "string", nullable: true, example: "20:00" },
      assignedAt: { type: "string", format: "date-time" },
      endedAt: { type: "string", format: "date-time", nullable: true },
    },
    required: ["id", "status", "property", "providerMembershipId", "provider", "guardMembershipId", "guard", "shiftStart", "shiftEnd", "assignedAt", "endedAt"],
  },
  ProviderGuardAssignmentResponse: {
    type: "object",
    properties: {
      success: { type: "boolean", enum: [true] },
      data: {
        type: "object",
        properties: {
          assignment: { $ref: "#/components/schemas/ProviderGuardAssignment" },
        },
        required: ["assignment"],
      },
      meta: { $ref: "#/components/schemas/Meta" },
    },
    required: ["success", "data", "meta"],
  },
  CreateGuardInvitationRequest: {
    type: "object",
    additionalProperties: false,
    properties: {
      identifier: {
        type: "string",
        minLength: 3,
        maxLength: 254,
        description: "Known Guard email address or Bangladesh mobile number.",
      },
    },
    required: ["identifier"],
  },
  CreateProviderGuardAssignmentRequest: {
    type: "object",
    additionalProperties: false,
    properties: {
      guardMembershipId: { type: "string", format: "uuid" },
      providerMembershipId: {
        type: "string",
        format: "uuid",
        description:
          "Required for a delegated Manager who can act for multiple Providers in the same Property.",
      },
      shiftStart: {
        type: "string",
        pattern: "^(?:[01]\\d|2[0-3]):[0-5]\\d$",
        example: "08:00",
      },
      shiftEnd: {
        type: "string",
        pattern: "^(?:[01]\\d|2[0-3]):[0-5]\\d$",
        example: "20:00",
      },
    },
    required: ["guardMembershipId", "shiftStart", "shiftEnd"],
  },
  CanonicalCreateProviderGuardAssignmentRequest: {
    type: "object",
    additionalProperties: false,
    properties: {
      propertyId: { type: "string", format: "uuid" },
      guardMembershipId: { type: "string", format: "uuid" },
      providerMembershipId: {
        type: "string",
        format: "uuid",
        description:
          "Required for a delegated Manager who can act for multiple Providers in the same Property.",
      },
      shiftStart: {
        type: "string",
        pattern: "^(?:[01]\\d|2[0-3]):[0-5]\\d$",
        example: "08:00",
      },
      shiftEnd: {
        type: "string",
        pattern: "^(?:[01]\\d|2[0-3]):[0-5]\\d$",
        example: "20:00",
      },
    },
    required: ["propertyId", "guardMembershipId", "shiftStart", "shiftEnd"],
  },
  UpdateGuardAssignmentRequest: {
    oneOf: [
      {
        type: "object",
        additionalProperties: false,
        properties: {
          action: { type: "string", enum: ["UPDATE_SHIFT"] },
          shiftStart: { type: "string", example: "09:00" },
          shiftEnd: { type: "string", example: "18:00" },
        },
        required: ["action", "shiftStart", "shiftEnd"],
      },
      {
        type: "object",
        additionalProperties: false,
        properties: { action: { type: "string", enum: ["SUSPEND"] } },
        required: ["action"],
      },
      {
        type: "object",
        additionalProperties: false,
        properties: { action: { type: "string", enum: ["RESUME"] } },
        required: ["action"],
      },
    ],
    discriminator: { propertyName: "action" },
  },
  RejectGuardAssignmentRequest: {
    type: "object",
    additionalProperties: false,
    properties: {},
  },
  GuardAssignmentTimeline: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      status: { $ref: "#/components/schemas/GuardAssignmentStatus" },
      shiftStart: { type: "string", nullable: true, example: "08:00" },
      shiftEnd: { type: "string", nullable: true, example: "20:00" },
      invitedAt: { type: "string", format: "date-time" },
      acceptedAt: { type: "string", format: "date-time", nullable: true },
      assignedAt: { type: "string", format: "date-time", nullable: true },
      endedAt: { type: "string", format: "date-time", nullable: true },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
    required: [
      "id",
      "status",
      "shiftStart",
      "shiftEnd",
      "invitedAt",
      "acceptedAt",
      "assignedAt",
      "endedAt",
      "createdAt",
      "updatedAt",
    ],
  },
  OwnerGuardAssignment: {
    allOf: [
      { $ref: "#/components/schemas/GuardAssignmentTimeline" },
      {
        type: "object",
        properties: {
          property: {
            type: "object",
            properties: {
              id: { type: "string", format: "uuid" },
              name: { type: "string" },
            },
            required: ["id", "name"],
          },
          guard: {
            type: "object",
            properties: {
              id: { type: "string", format: "uuid" },
              fullName: { type: "string" },
              emailMasked: { type: "string", example: "g***@example.com" },
              phoneMasked: { type: "string", example: "+88017*****678" },
            },
            required: ["id", "fullName", "emailMasked", "phoneMasked"],
          },
        },
        required: ["property", "guard"],
      },
    ],
  },
  GuardAssignment: {
    allOf: [
      { $ref: "#/components/schemas/GuardAssignmentTimeline" },
      {
        type: "object",
        properties: {
          property: {
            type: "object",
            properties: {
              id: { type: "string", format: "uuid" },
              name: { type: "string" },
              publicArea: { type: "string" },
            },
            required: ["id", "name", "publicArea"],
          },
          owner: {
            type: "object",
            properties: {
              id: { type: "string", format: "uuid" },
              fullName: { type: "string" },
            },
            required: ["id", "fullName"],
          },
        },
        required: ["property", "owner"],
      },
    ],
  },
  AssignmentPagination: {
    type: "object",
    properties: {
      page: { type: "integer", minimum: 1 },
      limit: { type: "integer", minimum: 1, maximum: 100 },
      total: { type: "integer", minimum: 0 },
      totalPages: { type: "integer", minimum: 0 },
    },
    required: ["page", "limit", "total", "totalPages"],
  },
  OwnerGuardAssignmentResponse: {
    type: "object",
    properties: {
      success: { type: "boolean", enum: [true] },
      data: {
        type: "object",
        properties: {
          assignment: { $ref: "#/components/schemas/OwnerGuardAssignment" },
        },
        required: ["assignment"],
      },
      meta: { $ref: "#/components/schemas/Meta" },
    },
    required: ["success", "data", "meta"],
  },
  GuardAssignmentResponse: {
    type: "object",
    properties: {
      success: { type: "boolean", enum: [true] },
      data: {
        type: "object",
        properties: {
          assignment: { $ref: "#/components/schemas/GuardAssignment" },
        },
        required: ["assignment"],
      },
      meta: { $ref: "#/components/schemas/Meta" },
    },
    required: ["success", "data", "meta"],
  },
  OwnerGuardAssignmentListResponse: {
    type: "object",
    properties: {
      success: { type: "boolean", enum: [true] },
      data: {
        type: "object",
        properties: {
          assignments: {
            type: "array",
            items: { $ref: "#/components/schemas/OwnerGuardAssignment" },
          },
          pagination: { $ref: "#/components/schemas/AssignmentPagination" },
        },
        required: ["assignments", "pagination"],
      },
      meta: { $ref: "#/components/schemas/Meta" },
    },
    required: ["success", "data", "meta"],
  },
  GuardAssignmentListResponse: {
    type: "object",
    properties: {
      success: { type: "boolean", enum: [true] },
      data: {
        type: "object",
        properties: {
          assignments: {
            type: "array",
            items: { $ref: "#/components/schemas/GuardAssignment" },
          },
          pagination: { $ref: "#/components/schemas/AssignmentPagination" },
        },
        required: ["assignments", "pagination"],
      },
      meta: { $ref: "#/components/schemas/Meta" },
    },
    required: ["success", "data", "meta"],
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
  ParkingResource: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      propertyId: { type: "string", format: "uuid" },
      resourceType: { type: "string", enum: ["FIXED_SPACE", "SHARED_POOL"] },
      displayName: { type: "string" },
      spotCode: { type: "string", nullable: true },
      capacity: { type: "integer", minimum: 1 },
      supportedVehicleTypes: { type: "array", items: { type: "string" } },
      isCovered: { type: "boolean" },
      status: { type: "string" },
    },
    required: ["id", "propertyId", "resourceType", "displayName", "capacity", "status"],
  },
  ParkingRight: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      parkingSpotId: { type: "string", format: "uuid" },
      rightType: { type: "string", enum: ["OWNERSHIP", "LEASE", "MANAGEMENT", "USE_ONLY"] },
      status: { type: "string", enum: ["PENDING_VERIFICATION", "VERIFIED", "REJECTED", "DISPUTED", "REVOKED"] },
      quantity: { type: "integer", minimum: 1 },
      canList: { type: "boolean" },
      validFrom: { type: "string", format: "date-time" },
      validUntil: { type: "string", format: "date-time", nullable: true },
    },
    required: ["id", "parkingSpotId", "rightType", "status", "quantity", "canList", "validFrom"],
  },
  ParkingListing: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      parkingSpotId: { type: "string", format: "uuid" },
      parkingRightId: { type: "string", format: "uuid" },
      title: { type: "string" },
      status: { type: "string", enum: ["DRAFT", "ACTIVE", "PAUSED", "SUSPENDED", "ENDED"] },
      pricePerHourPaisa: { type: "string", example: "5000" },
      securityDepositPaisa: { type: "string", example: "0" },
      allowedVehicleTypes: { type: "array", items: { type: "string" } },
    },
    required: ["id", "parkingSpotId", "parkingRightId", "title", "status", "pricePerHourPaisa"],
  },
  AvailabilityRule: {
    type: "object",
    properties: {
      dayOfWeek: { type: "integer", minimum: 0, maximum: 6 },
      startLocalTime: { type: "string", example: "08:00" },
      endLocalTime: { type: "string", example: "22:00" },
      isAvailable: { type: "boolean" },
      timeZone: { type: "string", enum: ["Asia/Dhaka"] },
    },
  },
  BookingQuote: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      listingId: { type: "string", format: "uuid" },
      startAt: { type: "string", format: "date-time" },
      endAt: { type: "string", format: "date-time" },
      totalAmountPaisa: { type: "string" },
      expiresAt: { type: "string", format: "date-time" },
    },
  },
  ReservationHold: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      status: { type: "string", enum: ["ACTIVE", "CONSUMED", "RELEASED", "EXPIRED"] },
      expiresAt: { type: "string", format: "date-time" },
    },
  },
  Booking: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      bookingCode: { type: "string" },
      status: { type: "string", enum: ["PAYMENT_PENDING", "CONFIRMED", "CHECKED_IN", "CHECKOUT_REQUESTED", "PAYMENT_DUE", "COMPLETED", "CANCELLED", "EXPIRED", "NO_SHOW", "DISPUTED"] },
      canCancel: { type: "boolean" },
      canPay: { type: "boolean" },
      totalAmountPaisa: { type: "string" },
      startAt: { type: "string", format: "date-time" },
      scheduledEndAt: { type: "string", format: "date-time" },
    },
  },
  AccessCredential: {
    type: "object",
    description: "Raw credential is returned once after successful payment; only its hash is stored.",
    properties: { accessCredential: { type: "string", writeOnly: true } },
  },
  Payment: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      status: { type: "string", enum: ["CREATED", "SESSION_CREATED", "PENDING", "VALIDATING", "SUCCEEDED", "CAPTURED", "FAILED", "CANCELLED", "EXPIRED", "REFUND_PENDING", "PARTIALLY_REFUNDED", "REFUNDED"] },
      amountPaisa: { type: "string" },
      providerReference: { type: "string", nullable: true },
    },
  },
  Wallet: {
    type: "object",
    properties: {
      currency: { type: "string", enum: ["BDT"] },
      availableBalancePaisa: { type: "string" },
      pendingBalancePaisa: { type: "string" },
      heldBalancePaisa: { type: "string" },
    },
  },
  Refund: {
    type: "object",
    properties: { id: { type: "string", format: "uuid" }, amountPaisa: { type: "string" }, status: { type: "string" } },
  },
  Payout: {
    type: "object",
    properties: { id: { type: "string", format: "uuid" }, amountPaisa: { type: "string" }, status: { type: "string" } },
  },
  Notification: {
    type: "object",
    properties: { id: { type: "string", format: "uuid" }, type: { type: "string" }, title: { type: "string" }, message: { type: "string" }, readAt: { type: "string", format: "date-time", nullable: true } },
  },
  Review: {
    type: "object",
    properties: { id: { type: "string", format: "uuid" }, rating: { type: "integer", minimum: 1, maximum: 5 }, comment: { type: "string", nullable: true }, providerReply: { type: "string", nullable: true } },
  },
  Dispute: {
    type: "object",
    properties: { id: { type: "string", format: "uuid" }, category: { type: "string" }, status: { type: "string" }, description: { type: "string" }, resolution: { type: "string", nullable: true } },
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
