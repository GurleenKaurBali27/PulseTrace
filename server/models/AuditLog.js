const { DataTypes } = require("sequelize");
const sequelize = require("../database/database");

const AuditLog = sequelize.define("AuditLog", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userRole: {
    type: DataTypes.STRING,
    allowLength: false
  },
  action: {
    type: DataTypes.STRING,
    allowNull: false
  },
  targetId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true
  }
}, {
  timestamps: true,
  updatedAt: false
});

module.exports = AuditLog;
