const { DataTypes } = require("sequelize");
const sequelize = require("../database/database");

const Invitation = sequelize.define("Invitation", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('ADMIN', 'DEVELOPER', 'VIEWER'),
    defaultValue: 'DEVELOPER'
  },
  token: {
    type: DataTypes.STRING,
    unique: true
  },
  status: {
    type: DataTypes.ENUM('PENDING', 'ACCEPTED', 'EXPIRED'),
    defaultValue: 'PENDING'
  }
});

module.exports = Invitation;
