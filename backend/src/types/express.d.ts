declare global {
  namespace Express {
    interface Request {
      requestId: string;
      auth?: {
        userId: string;
        sessionId: string;
        roles: import("../../generated/prisma/client.js").UserRoleType[];
        status: import("../../generated/prisma/client.js").UserStatus;
        mustChangePassword: boolean;
        emailVerified: boolean;
        phoneVerified: boolean;
      };
    }
  }
}

export {};
