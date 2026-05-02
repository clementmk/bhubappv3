const setupWebSocket = (io) => {
  const connectedUsers = new Map();

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // User joins with their userId
    socket.on('join', (userId) => {
      connectedUsers.set(socket.id, userId);
      socket.join(userId);
      console.log(`User ${userId} joined`);
      socket.broadcast.emit('user_joined', { userId });
    });

    // Route completion broadcast
    socket.on('route_completed', (data) => {
      console.log('Route completed:', data);
      io.emit('route_completed', { ...data, timestamp: new Date().toISOString() });
      io.emit('leaderboard_updated');
    });

    // New community post broadcast
    socket.on('post_created', (postData) => {
      console.log('New post created:', postData);
      io.emit('post_created', postData);
    });

    // Disconnection
    socket.on('disconnect', () => {
      const userId = connectedUsers.get(socket.id);
      if (userId) {
        connectedUsers.delete(socket.id);
        console.log(`User ${userId} disconnected`);
        socket.broadcast.emit('user_left', { userId });
      }
    });
  });

  return {
    getConnectedUsers: () => Array.from(connectedUsers.values()),
    getUserCount: () => connectedUsers.size,
    broadcast: (event, data) => io.emit(event, data),
  };
};

module.exports = setupWebSocket;
