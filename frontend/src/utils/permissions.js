// Simplified permissions system with just user and admin roles

// Check if user is admin
export const isAdmin = (user) => {
  return user && user.role === 'admin';
};

// Check if user is the owner of a resource
export const isOwner = (user, resource) => {
  if (!user || !resource) return false;
  
  const resourceOwnerId = resource.author?._id || resource.author || resource.user?._id || resource.user || resource._id;
  return resourceOwnerId === user._id || resourceOwnerId === user.id;
};

// User capabilities based on roles
export const canCreatePost = (user) => {
  return user?.isAuthenticated;
};

export const canEditPost = (user, post) => {
  if (!user || !post) return false;
  return isAdmin(user) || isOwner(user, post);
};

export const canDeletePost = (user, post) => {
  if (!user || !post) return false;
  return isAdmin(user) || isOwner(user, post);
};

export const canModerateContent = (user) => {
  return isAdmin(user);
};

export const canCreateComment = (user) => {
  return user?.isAuthenticated;
};

export const canEditComment = (user, comment) => {
  if (!user || !comment) return false;
  return isAdmin(user) || isOwner(user, comment);
};

export const canDeleteComment = (user, comment) => {
  if (!user || !comment) return false;
  return isAdmin(user) || isOwner(user, comment);
};

export const canAccessAdminDashboard = (user) => {
  return isAdmin(user);
};

export const canManageUsers = (user) => {
  return isAdmin(user);
};

export const canAccessAnalytics = (user) => {
  return isAdmin(user);
};

// Permission-based route configuration
export const getAccessibleRoutes = (user) => {
  const routes = [];
  
  // Public routes (always accessible)
  routes.push('/', '/posts', '/about', '/contact');
  
  if (user?.isAuthenticated) {
    routes.push('/dashboard', '/profile');
    
    if (canCreatePost(user)) {
      routes.push('/create-post');
    }
    
    if (canAccessAdminDashboard(user)) {
      routes.push('/admin');
      routes.push('/admin/users');
      routes.push('/admin/analytics');
    }
  }
  
  return routes;
};

// Feature flags based on roles
export const getFeatureFlags = (user) => {
  return {
    canCreatePost: canCreatePost(user),
    canModerateContent: canModerateContent(user),
    canAccessAdmin: canAccessAdminDashboard(user),
    canManageUsers: canManageUsers(user),
    canViewAnalytics: canAccessAnalytics(user),
  };
};
