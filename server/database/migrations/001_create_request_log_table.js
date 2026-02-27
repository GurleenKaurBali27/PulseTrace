/**
 * Migration: 001_create_request_log_table
 * Creates the RequestLog table with indexes
 * 
 * Usage: Automatically applied by migrate.js on startup
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create RequestLog table with all columns
    await queryInterface.createTable("RequestLogs", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      method: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      url: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      statusCode: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      duration: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: "Duration in milliseconds",
      },
      requestBody: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      responseBody: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      errorMessage: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      serviceName: {
        type: Sequelize.STRING,
        defaultValue: "default",
        allowNull: false,
        comment: "Name of the service that made the request",
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    // Create indexes for common queries
    await queryInterface.addIndex("RequestLogs", ["statusCode"], {
      name: "idx_status_code",
    });

    await queryInterface.addIndex("RequestLogs", ["createdAt"], {
      name: "idx_created_at",
    });

    await queryInterface.addIndex("RequestLogs", ["serviceName"], {
      name: "idx_service_name",
    });

    await queryInterface.addIndex("RequestLogs", ["method", "statusCode"], {
      name: "idx_method_status",
    });

    await queryInterface.addIndex("RequestLogs", ["serviceName", "createdAt"], {
      name: "idx_service_created",
    });

    console.log("✅ Created RequestLog table with indexes");
  },

  down: async (queryInterface, Sequelize) => {
    // Drop all indexes
    await queryInterface.removeIndex("RequestLogs", "idx_status_code");
    await queryInterface.removeIndex("RequestLogs", "idx_created_at");
    await queryInterface.removeIndex("RequestLogs", "idx_service_name");
    await queryInterface.removeIndex("RequestLogs", "idx_method_status");
    await queryInterface.removeIndex("RequestLogs", "idx_service_created");

    // Drop table
    await queryInterface.dropTable("RequestLogs");
    console.log("✅ Dropped RequestLog table");
  },
};
