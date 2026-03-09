import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from './AuthContext';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3001';

const SocketContext = createContext<Socket | null>(null);

export function SocketProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!user) {
      // Disconnect if logged out
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const newSocket = io(WS_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      console.log('[Socket] Connected');
    });

    // Real-time account updates → invalidate accounts query
    newSocket.on('account:status', () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    });

    newSocket.on('account:qr', () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    });

    newSocket.on('account:authenticated', () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    });

    // Campaign updates
    newSocket.on('campaign:progress', () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    });

    newSocket.on('campaign:status', () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    });

    // Activity updates
    newSocket.on('activity:new', () => {
      queryClient.invalidateQueries({ queryKey: ['activity'] });
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
