import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;

  connect(token: string) {
    if (this.socket?.connected) return;

    const socketUrl = window.location.origin; // Uses Vite dev proxy or standard domain
    this.socket = io(socketUrl, {
      auth: { token },
      query: { token },
      transports: ['websocket'],
      autoConnect: true,
    });

    this.socket.on('connect', () => {
      console.log('🔌 Real-Time Chat: Connected to server');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error.message);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      console.log('🔌 Real-Time Chat: Disconnected');
    }
  }

  sendMessage(receiverId: string, message: string) {
    if (this.socket) {
      this.socket.emit('send_message', { receiverId, message });
    }
  }

  joinChat(otherUserId: string) {
    if (this.socket) {
      this.socket.emit('join_chat', otherUserId);
    }
  }

  emitTyping(receiverId: string) {
    if (this.socket) {
      this.socket.emit('typing', { receiverId });
    }
  }

  emitStopTyping(receiverId: string) {
    if (this.socket) {
      this.socket.emit('stop_typing', { receiverId });
    }
  }

  onMessage(callback: (message: any) => void) {
    if (this.socket) {
      this.socket.on('receive_message', callback);
    }
    return () => {
      this.socket?.off('receive_message', callback);
    };
  }

  onUserStatus(callback: (data: { userId: string; status: 'online' | 'offline' }) => void) {
    if (this.socket) {
      this.socket.on('user_status', callback);
    }
    return () => {
      this.socket?.off('user_status', callback);
    };
  }

  onTyping(callback: (data: { senderId: string }) => void) {
    if (this.socket) {
      this.socket.on('typing', callback);
    }
    return () => {
      this.socket?.off('typing', callback);
    };
  }

  onStopTyping(callback: (data: { senderId: string }) => void) {
    if (this.socket) {
      this.socket.on('stop_typing', callback);
    }
    return () => {
      this.socket?.off('stop_typing', callback);
    };
  }

  onInventoryUpdate(callback: (data: { productId: string; variantId: string; stock: number }) => void) {
    if (this.socket) {
      this.socket.on('inventory_update', callback);
    }
    return () => {
      this.socket?.off('inventory_update', callback);
    };
  }
}

const socketService = new SocketService();
export default socketService;
