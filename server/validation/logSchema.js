const { z } = require("zod");

/**
 * Zod validation schema for incoming logs from the tracker
 * Ensures all required fields are present and valid types
 */

const logSchema = z.object({
  // Required fields
  method: z.enum(["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"], {
    errorMap: () => ({
      message: "method must be a valid HTTP method (GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS)"
    })
  }),
  
  route: z.string({
    errorMap: () => ({ message: "route is required" })
  })
    .min(1, "route cannot be empty")
    .max(500, "route cannot exceed 500 characters")
    .url("route must be a valid URL")
    .describe("API endpoint route"),
  
  statusCode: z.number({
    errorMap: () => ({ message: "statusCode is required and must be a number" })
  })
    .int("statusCode must be an integer")
    .min(100, "statusCode must be >= 100")
    .max(599, "statusCode must be <= 599")
    .describe("HTTP response status code"),
  
  // Optional fields with sensible defaults
  duration: z.number()
    .int("duration must be an integer (milliseconds)")
    .min(0, "duration cannot be negative")
    .default(0)
    .optional(),
  
  requestBody: z.any()
    .optional()
    .nullable()
    .default(null),
  
  responseBody: z.any()
    .optional()
    .nullable()
    .default(null),
  
  errorMessage: z.string()
    .max(1000, "errorMessage cannot exceed 1000 characters")
    .optional()
    .nullable()
    .default(null),
  
  serviceName: z.string()
    .min(1, "serviceName cannot be empty")
    .max(100, "serviceName cannot exceed 100 characters")
    .optional()
    .default("unknown-service"),
  
  requestId: z.string()
    .optional()
    .nullable()
    .default(null),
  
  responseSize: z.number()
    .int("responseSize must be an integer")
    .min(0, "responseSize cannot be negative")
    .optional()
    .default(0),
  
  details: z.record(z.any())
    .optional()
    .default({}),
  
  timestamp: z.number()
    .optional()
    .default(() => Date.now())
}).strict(); // Reject unknown fields

/**
 * Validate incoming log data
 * @param {object} data - Raw log data from tracker
 * @returns {Promise<{success: boolean, data?: object, error?: string, errors?: array}>}
 */
async function validateLog(data) {
  try {
    const validated = logSchema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    // Extract detailed error information
    const firstError = error.errors?.[0];
    const errorMessage = firstError?.message || error.message;
    
    return { 
      success: false, 
      error: errorMessage,
      errors: error.errors?.map(e => ({
        path: e.path.join(".") || "root",
        message: e.message,
        code: e.code
      }))
    };
  }
}

module.exports = {
  logSchema,
  validateLog
};
