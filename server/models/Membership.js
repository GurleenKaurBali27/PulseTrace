const { DataTypes } = require("sequelize");
const sequelize = require("../database/database");

const Membership = sequelize.define("Membership", {
  role: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'VIEWER',
    validate: {
      isIn: [['OWNER', 'ADMIN', 'DEVELOPER', 'VIEWER']]
    }
  }
});

module.exports = Membership;
