const mongoose = require('mongoose');

// Monitor database connection health
const monitorDbHealth = (req, res, next) => {
  // Check MongoDB connection state
  const state = mongoose.connection.readyState;
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
    99: 'uninitialized'
  };

  // Log connection state for monitoring
  console.log(`MongoDB Connection State: ${states[state]}`);

  // Add connection state to response headers for debugging
  res.set('X-DB-Status', states[state]);

  // If not connected, try to reconnect
  if (state !== 1) {
    console.log('MongoDB connection is not ready. Attempting to reconnect...');
    // Don't fail the request, let it proceed
    // The main connection logic will handle reconnection
  }

  next();
};

module.exports = monitorDbHealth; 