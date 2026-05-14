/**
 * PulseTrace Role-Based Access Control
 * Defines permissions for Owner, Admin, Developer, and Viewer
 */

const ROLES = {
  OWNER: 'OWNER',
  ADMIN: 'ADMIN',
  DEVELOPER: 'DEVELOPER',
  VIEWER: 'VIEWER'
};

const PERMISSIONS = {
  MANAGE_ORG: [ROLES.OWNER],
  MANAGE_PROJECTS: [ROLES.OWNER, ROLES.ADMIN],
  REVEAL_SENSITIVE: [ROLES.OWNER, ROLES.ADMIN],
  DELETE_LOGS: [ROLES.OWNER, ROLES.ADMIN],
  EXPORT_DATA: [ROLES.OWNER, ROLES.ADMIN, ROLES.DEVELOPER],
  VIEW_METRICS: [ROLES.OWNER, ROLES.ADMIN, ROLES.DEVELOPER, ROLES.VIEWER],
  VIEW_AUDITS: [ROLES.OWNER, ROLES.ADMIN]
};

const rbac = (requiredPermission) => {
  return (req, res, next) => {
    // req.userRole is populated by authMiddleware
    const userRole = req.userRole;
    
    if (!userRole) {
      return res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        message: 'No organization context found. Please provide x-org-id.'
      });
    }
    
    const allowedRoles = PERMISSIONS[requiredPermission] || [];
    
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        message: `Your role (${userRole}) does not have permission: ${requiredPermission}`
      });
    }

    next();
  };
};

module.exports = { rbac, ROLES };
