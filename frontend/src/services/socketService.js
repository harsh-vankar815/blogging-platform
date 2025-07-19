import { io } from 'socket.io-client';

let socket;

/**
 * Initialize the Socket.IO connection
 * @returns {Object} The socket instance
 */
export const initializeSocket = () => {
  if (!socket) {
    // Use base URL without /api path for socket connection
    const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
    
    console.log('Initializing socket connection to:', SOCKET_URL);
    
    // Get auth token for authentication
    const token = localStorage.getItem('token');
    
    socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      auth: token ? { token } : undefined
    });

    socket.on('connect', () => {
      console.log('Socket connected successfully:', socket.id);
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      // Try to reconnect after a delay
      setTimeout(() => {
        console.log('Attempting to reconnect socket...');
        // Check for updated token
        const updatedToken = localStorage.getItem('token');
        if (updatedToken) {
          socket.auth = { token: updatedToken };
        }
        socket.connect();
      }, 5000);
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      if (reason === 'io server disconnect') {
        // The server has forcefully disconnected
        // Try to reconnect after a delay
        setTimeout(() => {
          console.log('Attempting to reconnect socket after server disconnect...');
          // Check for updated token
          const updatedToken = localStorage.getItem('token');
          if (updatedToken) {
            socket.auth = { token: updatedToken };
          }
          socket.connect();
        }, 5000);
      }
    });
    
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    // Debug all incoming events
    socket.onAny((event, ...args) => {
      console.log(`[Socket Debug] Received event: ${event}`, args);
    });
  }

  return socket;
};

/**
 * Join a post room to receive real-time updates for a specific post
 * @param {string} postId - The ID of the post to join
 */
export const joinPostRoom = (postId) => {
  if (socket && postId) {
    const roomName = `post:${postId}`;
    console.log(`Joining room: ${roomName}`);
    socket.emit('join_room', { room: roomName });
  }
};

/**
 * Leave a post room when no longer needed
 * @param {string} postId - The ID of the post to leave
 */
export const leavePostRoom = (postId) => {
  if (socket && postId) {
    const roomName = `post:${postId}`;
    console.log(`Leaving room: ${roomName}`);
    socket.emit('leave_room', { room: roomName });
  }
};

/**
 * Send a new comment to the server
 * @param {Object} commentData - The comment data
 */
export const sendNewComment = (commentData) => {
  if (socket && commentData) {
    socket.emit('new_comment', commentData);
  }
};

/**
 * Send a comment like to the server
 * @param {Object} likeData - The like data including postId, commentId, userId
 */
export const sendCommentLike = (data) => {
  if (socket) {
    console.log('Sending comment_like event:', data);
    socket.emit('comment_like', data);
  } else {
    console.error('Socket not connected, cannot send comment_like');
  }
};

/**
 * Send a post like to the server
 * @param {Object} likeData - The like data
 */
export const sendPostLike = (likeData) => {
  if (socket && likeData) {
    socket.emit('post_like', likeData);
  }
};

/**
 * Send a comment dislike to the server
 * @param {Object} dislikeData - The dislike data including postId, commentId, userId
 */
export const sendCommentDislike = (data) => {
  if (socket) {
    console.log('Sending comment_dislike event:', data);
    socket.emit('comment_dislike', data);
  } else {
    console.error('Socket not connected, cannot send comment_dislike');
  }
};

/**
 * Send a comment report to the server
 * @param {Object} reportData - The report data
 */
export const sendCommentReport = (reportData) => {
  if (socket && reportData) {
    socket.emit('comment_report', reportData);
  }
};

/**
 * Subscribe to comment added events
 * @param {Function} callback - The callback function
 */
export const onCommentAdded = (callback) => {
  if (socket) {
    socket.on('comment_added', callback);
    return () => socket.off('comment_added', callback);
  }
  return () => {};
};

/**
 * Subscribe to comment liked events
 * @param {Function} callback - The callback function
 */
export const onCommentLiked = (callback) => {
  if (socket) {
    socket.on('comment_liked', (data) => {
      console.log('Received comment_liked event:', data);
      callback(data);
    });
    
    // Also listen for general comment updates that might include like changes
    socket.on('comment_updated', (data) => {
      if (data.type === 'LIKE') {
        console.log('Received comment_updated (LIKE) event:', data);
        callback(data);
      }
    });
    
    return () => {
      socket.off('comment_liked');
      socket.off('comment_updated');
    };
  }
  return () => {};
};

/**
 * Subscribe to post liked events
 * @param {Function} callback - The callback function
 */
export const onPostLiked = (callback) => {
  if (socket) {
    socket.on('post_liked', callback);
    return () => socket.off('post_liked', callback);
  }
  return () => {};
};

/**
 * Subscribe to comment updated events
 * @param {Function} callback - The callback function
 */
export const onCommentUpdated = (callback) => {
  if (socket) {
    socket.on('comment_updated', callback);
    return () => socket.off('comment_updated', callback);
  }
  return () => {};
};

/**
 * Subscribe to comment deleted events
 * @param {Function} callback - The callback function
 */
export const onCommentDeleted = (callback) => {
  if (socket) {
    socket.on('comment_deleted', callback);
    return () => socket.off('comment_deleted', callback);
  }
  return () => {};
};

/**
 * Subscribe to comment disliked events
 * @param {Function} callback - The callback function
 */
export const onCommentDisliked = (callback) => {
  if (socket) {
    socket.on('comment_disliked', (data) => {
      console.log('Received comment_disliked event:', data);
      callback(data);
    });
    
    // Also listen for general comment updates that might include dislike changes
    socket.on('comment_updated', (data) => {
      if (data.type === 'DISLIKE') {
        console.log('Received comment_updated (DISLIKE) event:', data);
        callback(data);
      }
    });
    
    return () => {
      socket.off('comment_disliked');
      socket.off('comment_updated');
    };
  }
  return () => {};
};

/**
 * Subscribe to comment reported events
 * @param {Function} callback - The callback function
 */
export const onCommentReported = (callback) => {
  if (socket) {
    socket.on('comment_reported', callback);
    return () => socket.off('comment_reported', callback);
  }
  return () => {};
};

/**
 * Subscribe to comment approved events
 * @param {Function} callback - The callback function
 */
export const onCommentApproved = (callback) => {
  if (socket) {
    socket.on('comment_approved', callback);
    return () => socket.off('comment_approved', callback);
  }
  return () => {};
};

/**
 * Disconnect the socket
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export default {
  initializeSocket,
  joinPostRoom,
  leavePostRoom,
  sendNewComment,
  sendCommentLike,
  sendPostLike,
  sendCommentDislike,
  sendCommentReport,
  onCommentAdded,
  onCommentLiked,
  onPostLiked,
  onCommentUpdated,
  onCommentDeleted,
  onCommentDisliked,
  onCommentReported,
  onCommentApproved,
  disconnectSocket,
};

