declare global {
  namespace Express {
    interface Request {
      requestId: string;
      auth?: {
        userId: string;
        sessionId: string;
        roles: import("../../generated/prisma/client.js").UserRoleType[];
        mustChangePassword: boolean;
      };
    }
  }
}

export {};
