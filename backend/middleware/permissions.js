const User = require('../models/User');

// Permission definitions (matching frontend)
const PERMISSIONS = {
  // Post permissions
  POST_CREATE: 'post:create',
  POST_READ: 'post:read',
  POST_UPDATE: 'post:update',
  POST_DELETE: 'post:delete',
  POST_PUBLISH: 'post:publish',
  POST_MODERATE: 'post:moderate',
  
  // Comment permissions
  COMMENT_CREATE: 'comment:create',
  COMMENT_READ: 'comment:read',
  COMMENT_UPDATE: 'comment:update',
  COMMENT_DELETE: 'comment:delete',
  COMMENT_MODERATE: 'comment:moderate',
  
  // User permissions
  USER_READ: 'user:read',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',
  USER_MANAGE: 'user:manage',
  
  // Admin permissions
  ADMIN_DASHBOARD: 'admin:dashboard',
  ADMIN_SETTINGS: 'admin:settings',
  ADMIN_ANALYTICS: 'admin:analytics',
  ADMIN_USERS: 'admin:users',
  ADMIN_CONTENT: 'admin:content',
  
  // System permissions
  SYSTEM_BACKUP: 'system:backup',
  SYSTEM_MAINTENANCE: 'system:maintenance',
};

// Role-based permission mapping
const ROLE_PERMISSIONS = {
  user: [
    PERMISSIONS.POST_READ,
    PERMISSIONS.COMMENT_READ,
    PERMISSIONS.COMMENT_CREATE,
    PERMISSIONS.USER_READ,
    PERMISSIONS.USER_UPDATE, // Own profile only
  ],
  
  author: [
    PERMISSIONS.POST_READ,
    PERMISSIONS.COMMENT_READ,
    PERMISSIONS.COMMENT_CREATE,
    PERMISSIONS.USER_READ,
    PERMISSIONS.USER_UPDATE,
    PERMISSIONS.POST_CREATE,
    PERMISSIONS.POST_UPDATE, // Own posts only
    PERMISSIONS.POST_DELETE, // Own posts only
    PERMISSIONS.POST_PUBLISH, // Own posts only
    PERMISSIONS.COMMENT_UPDATE, // Own comments only
    PERMISSIONS.COMMENT_DELETE, // Own comments only
  ],
  
  moderator: [
    PERMISSIONS.POST_READ,
    PERMISSIONS.COMMENT_READ,
    PERMISSIONS.COMMENT_CREATE,
    PERMISSIONS.USER_READ,
    PERMISSIONS.USER_UPDATE,
    PERMISSIONS.POST_CREATE,
    PERMISSIONS.POST_UPDATE,
    PERMISSIONS.POST_DELETE,
    PERMISSIONS.POST_PUBLISH,
    PERMISSIONS.COMMENT_UPDATE,
    PERMISSIONS.COMMENT_DELETE,
    PERMISSIONS.POST_MODERATE,
    PERMISSIONS.COMMENT_MODERATE,
    PERMISSIONS.ADMIN_CONTENT,
  ],
  
  admin: Object.values(PERMISSIONS), // All permissions
};

// Permission checker functions
const hasPermission = (user, permission) => {
  if (!user || !user.role) return false;
  
  const rolePermissions = ROLE_PERMISSIONS[user.role] || [];
  return rolePermissions.includes(permission);
};

const hasAnyPermission = (user, permissions) => {
  if (!user || !permissions || permissions.length === 0) return false;
  
  return permissions.some(permission => hasPermission(user, permission));
};

const hasAllPermissions = (user, permissions) => {
  if (!user || !permissions || permissions.length === 0) return false;
  
  return permissions.every(permission => hasPermission(user, permission));
};

// Resource ownership checks
const canAccessResource = (user, resource, permission) => {
  if (!user || !resource) return false;
  
  // Check if user has the permission
  if (!hasPermission(user, permission)) return false;
  
  // For certain permissions, check ownership
  const ownershipPermissions = [
    PERMISSIONS.POST_UPDATE,
    PERMISSIONS.POST_DELETE,
    PERMISSIONS.COMMENT_UPDATE,
    PERMISSIONS.COMMENT_DELETE,
    PERMISSIONS.USER_UPDATE,
  ];
  
  if (ownershipPermissions.includes(permission)) {
    // Admin and moderator can access all resources
    if (user.role === 'admin' || user.role === 'moderator') {
      return true;
    }
    
    // Check ownership
    const resourceOwnerId = resource.author?._id || resource.author || resource.user?._id || resource.user || resource._id;
    return resourceOwnerId.toString() === user._id.toString();
  }
  
  return true;
};

// Middleware functions
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    if (!hasPermission(req.user, permission)) {
      return res.status(403).json({
        message: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        required: permission,
        userRole: req.user.role
      });
    }

    next();
  };
};

const requireAnyPermission = (permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    if (!hasAnyPermission(req.user, permissions)) {
      return res.status(403).json({
        message: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        required: permissions,
        userRole: req.user.role
      });
    }

    next();
  };
};

const requireAllPermissions = (permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    if (!hasAllPermissions(req.user, permissions)) {
      return res.status(403).json({
        message: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        required: permissions,
        userRole: req.user.role
      });
    }

    next();
  };
};

const requireRole = (roles) => {
  const roleArray = Array.isArray(roles) ? roles : [roles];
  
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    if (!roleArray.includes(req.user.role)) {
      return res.status(403).json({
        message: 'Insufficient role permissions',
        code: 'INSUFFICIENT_ROLE',
        required: roleArray,
        userRole: req.user.role
      });
    }

    next();
  };
};

const requireResourceOwnership = (permission, resourceParam = 'id', resourceModel = null) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          message: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      // Admin and moderator bypass ownership checks
      if (req.user.role === 'admin' || req.user.role === 'moderator') {
        return next();
      }

      let resource;
      
      if (resourceModel) {
        // Fetch resource from database
        resource = await resourceModel.findById(req.params[resourceParam]);
        if (!resource) {
          return res.status(404).json({
            message: 'Resource not found',
            code: 'RESOURCE_NOT_FOUND'
          });
        }
      } else {
        // Use resource from previous middleware (e.g., from req.post, req.comment)
        resource = req.post || req.comment || req.targetUser;
      }

      if (!canAccessResource(req.user, resource, permission)) {
        return res.status(403).json({
          message: 'You can only access your own resources',
          code: 'OWNERSHIP_REQUIRED'
        });
      }

      // Store resource in request for use in route handler
      if (resourceModel) {
        const resourceName = resourceModel.modelName.toLowerCase();
        req[resourceName] = resource;
      }

      next();
    } catch (error) {
      console.error('Resource ownership check error:', error);
      res.status(500).json({
        message: 'Server error during permission check',
        code: 'PERMISSION_CHECK_ERROR'
      });
    }
  };
};

// Simplified permissions system with just user and admin roles

// Check if user is admin
const isAdmin = (user) => {
  return user && user.role === 'admin';
};

// Check if user is the owner of a resource
const isOwner = (user, resource) => {
  if (!user || !resource) return false;
  
  const resourceOwnerId = resource.author?._id || resource.author || resource.user?._id || resource.user || resource._id;
  return resourceOwnerId.toString() === user._id.toString();
};

// Middleware to require admin role
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      message: 'Authentication required',
      code: 'AUTH_REQUIRED'
    });
  }

  if (!isAdmin(req.user)) {
    return res.status(403).json({
      message: 'Admin access required',
      code: 'ADMIN_REQUIRED'
    });
  }

  next();
};

// Middleware to require ownership or admin role
const requireOwnershipOrAdmin = (resourceParam = 'id', resourceModel = null) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          message: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      // Admin bypass ownership checks
      if (isAdmin(req.user)) {
        return next();
      }

      let resource;
      
      if (resourceModel) {
        // Fetch resource from database
        resource = await resourceModel.findById(req.params[resourceParam]);
        if (!resource) {
          return res.status(404).json({
            message: 'Resource not found',
            code: 'RESOURCE_NOT_FOUND'
          });
        }
      } else {
        // Use resource from previous middleware
        const resourceName = Object.keys(req).find(key => 
          key !== 'user' && 
          key !== 'params' && 
          key !== 'body' && 
          key !== 'query' && 
          typeof req[key] === 'object'
        );
        
        if (!resourceName || !req[resourceName]) {
          return res.status(400).json({
            message: 'Resource not found in request',
            code: 'RESOURCE_NOT_FOUND_IN_REQUEST'
          });
        }
        
        resource = req[resourceName];
      }

      // Check ownership
      if (!isOwner(req.user, resource)) {
        return res.status(403).json({
          message: 'Access denied - you are not the owner of this resource',
          code: 'NOT_RESOURCE_OWNER'
        });
      }

      next();
    } catch (error) {
      console.error('Ownership check error:', error);
      res.status(500).json({
        message: 'Server error during permission check',
        code: 'SERVER_ERROR'
      });
    }
  };
};

// Middleware to require email verification
const requireEmailVerified = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      message: 'Authentication required',
      code: 'AUTH_REQUIRED'
    });
  }

  if (!req.user.emailVerified) {
    return res.status(403).json({
      message: 'Email verification required',
      code: 'EMAIL_VERIFICATION_REQUIRED'
    });
  }

  next();
};

module.exports = {
  PERMISSIONS,
  ROLE_PERMISSIONS,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  canAccessResource,
  requirePermission,
  requireAnyPermission,
  requireAllPermissions,
  requireRole,
  requireResourceOwnership,
  isAdmin,
  isOwner,
  requireAdmin,
  requireOwnershipOrAdmin,
  requireEmailVerified
};
