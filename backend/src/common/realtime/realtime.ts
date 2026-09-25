import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import { env } from "../../config/env.js";
import { logger } from "../../config/logger.js";
import { verifyAccessToken } from "../auth/jwt.js";
import { findAccessSession } from "../../modules/auth/auth.repository.js";

export type FinancialRealtimeEvent =
  | "booking:confirmed"
  | "booking:cancelled"
  | "booking:expired"
  | "booking:checkout_requested"
  | "booking:settlement_completed"
  | "booking:payment_due"
  | "wallet:balance_changed"
  | "payout:status_changed";

let io: Server | null = null;

function cookieValue(header: string | undefined, name: string) {
  return header
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

export function configureRealtime(server: HttpServer) {
  io = new Server(server, {
    cors: { origin: env.CORS_ORIGIN, credentials: true },
    transports: ["websocket", "polling"],
  });
  io.use(async (socket, next) => {
    try {
      const bearer =
        typeof socket.handshake.auth["token"] === "string"
          ? socket.handshake.auth["token"]
          : undefined;
      const token =
        bearer || cookieValue(socket.handshake.headers.cookie, "access_token");
      if (!token) throw new Error("AUTH_REQUIRED");
      const payload = await verifyAccessToken(token);
      const session = await findAccessSession({
        sessionId: payload.sessionId,
        userId: payload.userId,
      });
      if (!session) throw new Error("AUTH_INVALID_TOKEN");
      socket.data["userId"] = payload.userId;
      next();
    } catch {
      next(new Error("Authentication required"));
    }
  });
  io.on("connection", (socket) => {
    const userId = String(socket.data["userId"]);
    void socket.join(`user:${userId}`);
  });
  logger.info("Authenticated realtime notifications enabled");
  return io;
}

export function notifyUser(
  userId: string,
  event: FinancialRealtimeEvent,
  entity: { bookingId?: string; payoutId?: string },
) {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, {
    ...entity,
    changedAt: new Date().toISOString(),
  });
}
