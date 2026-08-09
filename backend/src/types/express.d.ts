declare global {
  namespace Express {
    interface Request {
      requestId: string;
      auth?: {
        userId: string;
        roles: string[];
      };
    }
  }
}

export {};
