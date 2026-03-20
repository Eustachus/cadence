"use client";

import { createContext, useContext, useEffect, useRef, ReactNode } from "react";
import { io, Socket } from "socket.io-client";
import { useSession } from "next-auth/react";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export function useSocket() {
  return useContext(SocketContext);
}

interface SocketProviderProps {
  children: ReactNode;
  orgId?: string;
}

export function SocketProvider({ children, orgId }: SocketProviderProps) {
  const { data: session } = useSession();
  const socketRef = useRef<Socket | null>(null);
  const isConnectedRef = useRef(false);

  useEffect(() => {
    if (!session?.user?.id) return;

    const socketUrl =
      process.env.NEXT_PUBLIC_WS_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const socket = io(socketUrl, {
      transports: ["websocket", "polling"],
      autoConnect: true,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      isConnectedRef.current = true;
      console.log("[Socket] Connected:", socket.id);

      // Join org room if available
      if (orgId && session.user?.id) {
        socket.emit("join:org", orgId, session.user.id);
      }
    });

    socket.on("disconnect", () => {
      isConnectedRef.current = false;
      console.log("[Socket] Disconnected");
    });

    return () => {
      if (orgId && session.user?.id) {
        socket.emit("leave:org", orgId, session.user.id);
      }
      socket.disconnect();
      socketRef.current = null;
    };
  }, [session?.user?.id, orgId]);

  return (
    <SocketContext.Provider
      value={{
        socket: socketRef.current,
        isConnected: isConnectedRef.current,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}
