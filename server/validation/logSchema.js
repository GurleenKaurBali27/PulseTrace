const { z } = require("zod");

const logSchema = z.object({
  method: z.string(),
  route: z.string(),
  statusCode: z.number(),
  duration: z.number().optional().default(0),
  requestBody: z.any().optional().nullable().default(null),
  responseBody: z.any().optional().nullable().default(null),
  errorMessage: z.string().optional().nullable().default(null),
  serviceName: z.string().optional().default("unknown-service"),
  requestId: z.string().optional().nullable().default(null),
  responseSize: z.number().optional().default(0),
  details: z.any().optional().default({}),
  traceId: z.string().optional().nullable(),
  spanId: z.string().optional().nullable(),
  parentSpanId: z.string().optional().nullable(),
  requestDepth: z.number().optional().default(0),
  timestamp: z.number().optional().default(() => Date.now())
});

async function validateLog(data) {
  try {
    const validated = logSchema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    return { 
      success: false, 
      error: error.message
    };
  }
}

module.exports = {
  logSchema,
  validateLog
};
