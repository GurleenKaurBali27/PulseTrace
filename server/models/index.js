const User = require("./User");
const Organization = require("./Organization");
const Project = require("./Project");
const Membership = require("./Membership");
const RequestLog = require("./RequestLog");
const AuditLog = require("./AuditLog");
const Invitation = require("./Invitation");

// User <-> Organization (Many-to-Many via Membership)
User.belongsToMany(Organization, { through: Membership });
Organization.belongsToMany(User, { through: Membership });

// Membership Associations
Membership.belongsTo(User);
Membership.belongsTo(Organization);
User.hasMany(Membership);
Organization.hasMany(Membership);

// Organization <-> Project (One-to-Many)
Organization.hasMany(Project, { onDelete: 'CASCADE' });
Project.belongsTo(Organization);

// Organization <-> Invitation (One-to-Many)
Organization.hasMany(Invitation, { onDelete: 'CASCADE' });
Invitation.belongsTo(Organization);

// Project <-> RequestLog (One-to-Many)
Project.hasMany(RequestLog, { foreignKey: 'projectId' });
RequestLog.belongsTo(Project, { foreignKey: 'projectId' });

// Audit Logs
User.hasMany(AuditLog, { foreignKey: 'userId' });
AuditLog.belongsTo(User, { foreignKey: 'userId' });

module.exports = {
  User,
  Organization,
  Project,
  Membership,
  RequestLog,
  AuditLog,
  Invitation
};
