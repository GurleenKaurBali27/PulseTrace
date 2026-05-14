const { DataTypes } = require("sequelize");
const sequelize = require("../database/database");

const Project = sequelize.define("Project", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  apiKey: {
    type: DataTypes.STRING,
    unique: true,
    defaultValue: () => require('crypto').randomBytes(24).toString('hex')
  }
});

module.exports = Project;
