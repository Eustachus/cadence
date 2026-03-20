import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(handler);
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${port}`,
      methods: ["GET", "POST"],
    },
  });

  // Track online users per org
  const onlineUsers = new Map<string, Set<string>>();

  io.on("connection", (socket) => {
    console.log(`[Socket] User connected: ${socket.id}`);

    // Join organization room
    socket.on("join:org", (orgId: string, userId: string) => {
      socket.join(`org:${orgId}`);
      if (!onlineUsers.has(orgId)) onlineUsers.set(orgId, new Set());
      onlineUsers.get(orgId)!.add(userId);

      // Broadcast presence
      io.to(`org:${orgId}`).emit("presence:update", {
        userId,
        status: "online",
        onlineUsers: Array.from(onlineUsers.get(orgId)!),
      });

      console.log(`[Socket] User ${userId} joined org:${orgId}`);
    });

    // Leave organization
    socket.on("leave:org", (orgId: string, userId: string) => {
      socket.leave(`org:${orgId}`);
      onlineUsers.get(orgId)?.delete(userId);

      io.to(`org:${orgId}`).emit("presence:update", {
        userId,
        status: "offline",
        onlineUsers: Array.from(onlineUsers.get(orgId) || []),
      });
    });

    // Task updates
    socket.on(
      "task:updated",
      (data: { orgId: string; task: Record<string, unknown> }) => {
        socket.to(`org:${data.orgId}`).emit("task:updated", data.task);
      }
    );

    socket.on(
      "task:created",
      (data: { orgId: string; task: Record<string, unknown> }) => {
        socket.to(`org:${data.orgId}`).emit("task:created", data.task);
      }
    );

    socket.on(
      "task:moved",
      (data: { orgId: string; taskId: string; sectionId: string; position: number }) => {
        socket.to(`org:${data.orgId}`).emit("task:moved", data);
      }
    );

    // Comments
    socket.on(
      "comment:created",
      (data: { orgId: string; taskId: string; comment: Record<string, unknown> }) => {
        socket.to(`org:${data.orgId}`).emit("comment:created", data);
      }
    );

    // Notifications
    socket.on(
      "notification:send",
      (data: { orgId: string; userId: string; notification: Record<string, unknown> }) => {
        socket.to(`org:${data.orgId}`).emit("notification:new", data.notification);
      }
    );

    // Typing indicator
    socket.on(
      "typing:start",
      (data: { orgId: string; taskId: string; userId: string; userName: string }) => {
        socket.to(`org:${data.orgId}`).emit("typing:start", data);
      }
    );

    socket.on(
      "typing:stop",
      (data: { orgId: string; taskId: string; userId: string }) => {
        socket.to(`org:${data.orgId}`).emit("typing:stop", data);
      }
    );

    // Disconnect
    socket.on("disconnect", () => {
      console.log(`[Socket] User disconnected: ${socket.id}`);
      // Clean up presence for all orgs this socket was in
      onlineUsers.forEach((users, orgId) => {
        users.forEach((userId) => {
          io.to(`org:${orgId}`).emit("presence:update", {
            userId,
            status: "offline",
            onlineUsers: Array.from(users),
          });
        });
      });
    });
  });

  httpServer
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Cadence ready on http://${hostname}:${port}`);
      console.log(`> WebSocket server ready on ws://${hostname}:${port}`);
    });
});
