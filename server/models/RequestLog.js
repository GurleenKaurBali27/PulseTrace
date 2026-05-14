const { DataTypes } = require("sequelize");
const sequelize = require("../database/database");

/**
 * RequestLog Model - Stores API request/response metrics
 * 
 * Fields:
 * - serviceName: Name of the service/API (default: "default-service")
 * - requestId: Unique identifier for the request
 * - method: HTTP method (GET, POST, etc.)
 * - route: Request URL/route
 * - statusCode: HTTP response status code
 * - duration: Request duration in milliseconds
 * - error: Error message if request failed
 * - requestBody: Serialized request body
 * - responseSize: Size of response in bytes
 * - details: JSON object containing full request/response details
 *   {
 *     request: { headers, body, query, params, path, ip, userAgent, contentType },
 *     response: { statusCode, headers, body, size }
 *   }
 */
const RequestLog = sequelize.define(
  "RequestLog",
  {
    serviceName: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "default-service",
      validate: {
        notEmpty: true
      },
      comment: "Name of the service/API"
    },
    requestId: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    method: {
      type: DataTypes.STRING(10),
      allowNull: false,
      validate: {
        notEmpty: true,
        isIn: [["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"]]
      }
    },
    route: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    statusCode: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 100,
        max: 599
      }
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 0
      },
      comment: "Duration in milliseconds"
    },
    error: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    requestBody: {
      type: DataTypes.JSON,
      allowNull: true
    },
    responseSize: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 0
      },
      comment: "Response size in bytes"
    },
    traceId: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "Unique ID for the entire request chain"
    },
    spanId: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "Unique ID for this specific operation"
    },
    parentSpanId: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "ID of the calling span"
    },
    requestDepth: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
      comment: "Nesting depth of the request"
    },
    details: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: "Detailed request/response information including headers, body, params",
      get() {
        const value = this.getDataValue("details");
        if (typeof value === "string") {
          try {
            return JSON.parse(value);
          } catch {
            return value;
          }
        }
        return value;
      }
    },
    projectId: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: "ID of the project this log belongs to"
    }
  },
  {
    tableName: "RequestLogs",
    timestamps: true,
    indexes: [
      {
        fields: ["serviceName"]
      },
      {
        fields: ["statusCode"]
      },
      {
        fields: ["createdAt"]
      },
      {
        fields: ["method"]
      },
      {
        fields: ["serviceName", "createdAt"]
      }
    ]
  }
);

module.exports = RequestLog;