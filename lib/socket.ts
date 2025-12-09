import { Server } from 'socket.io';
import { createServer } from 'http';

let io: Server | null = null;

export function initSocket(server: any) {
  if (io) return io;

  io = new Server(server, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('join-user-room', (userId: string) => {
      socket.join(`user-${userId}`);
      console.log(`User ${userId} joined their room`);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
}

export function getSocketInstance() {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
}

// Helper to emit credit update to specific user
export function emitCreditUpdate(userId: string, credits: number) {
  if (io) {
    io.to(`user-${userId}`).emit('credit-update', { credits });
  }
}

// Helper to emit transaction to specific user
export function emitTransaction(userId: string, transaction: any) {
  if (io) {
    io.to(`user-${userId}`).emit('transaction', transaction);
  }
}
