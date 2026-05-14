/**
 * PulseTrace Sensitive Data Masking Engine
 * Enterprise-grade redaction for PII and Auth data
 */

const MASKING_PATTERNS = {
  AUTHORIZATION: /Bearer\s+[a-zA-Z0-9\-_]+\.[a-zA-Z0-9\-_]+\.[a-zA-Z0-9\-_]+/gi,
  JWT: /[a-zA-Z0-9\-_]+\.[a-zA-Z0-9\-_]+\.[a-zA-Z0-9\-_]+/gi,
  API_KEY: /(api[_\-]?(key|token|auth))["']?\s*[:=]\s*["']?([a-zA-Z0-9_\-]{16,})["']?/gi,
  EMAIL: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi,
  PHONE: /(\+?\d{1,4}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/gi,
  CREDIT_CARD: /\b(?:\d[ -]*?){13,16}\b/g,
  PASSWORD: /(pass(word|phrase)?)["']?\s*[:=]\s*["']?([^"']+)["']?/gi,
  SSN: /\b\d{3}-\d{2}-\d{4}\b/g
};

class MaskingEngine {
  constructor(config = {}) {
    this.allowlist = new Set(config.allowlist || []);
    this.denylist = new Set(config.denylist || []);
    this.mode = config.mode || 'partial';
  }

  maskString(text) {
    if (typeof text !== 'string') return text;
    let masked = text;

    Object.entries(MASKING_PATTERNS).forEach(([key, pattern]) => {
      masked = masked.replace(pattern, (match) => {
        if (this.mode === 'full') return `@@REDACTED_${key}@@`;
        
        // Partial masking with a special delimiter for frontend detection
        const redactedPart = match.length <= 8 
          ? '****' 
          : match.substring(0, 4) + '...' + match.substring(match.length - 4);
        
        return `@@MASKED:${key}:${redactedPart}@@`;
      });
    });

    return masked;
  }

  maskObject(obj, currentPath = '') {
    if (!obj || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(i => this.maskObject(i, currentPath));

    const maskedObj = {};
    for (const [key, value] of Object.entries(obj)) {
      const path = currentPath ? `${currentPath}.${key}` : key;
      const lowerKey = key.toLowerCase();

      if (this.allowlist.has(path) || this.allowlist.has(key)) {
        maskedObj[key] = value;
        continue;
      }

      const isSensitiveKey = 
        this.denylist.has(path) || 
        this.denylist.has(key) ||
        lowerKey.includes('password') ||
        lowerKey.includes('secret') ||
        lowerKey.includes('token') ||
        lowerKey.includes('auth') ||
        lowerKey.includes('key') ||
        lowerKey.includes('cookie');

      if (isSensitiveKey) {
        maskedObj[key] = `@@REDACTED_KEY:${key}@@`;
      } else if (typeof value === 'string') {
        maskedObj[key] = this.maskString(value);
      } else if (typeof value === 'object') {
        maskedObj[key] = this.maskObject(value, path);
      } else {
        maskedObj[key] = value;
      }
    }
    return maskedObj;
  }

  sanitizeLog(log) {
    const sanitized = { ...log };
    
    if (sanitized.details) {
      const details = typeof sanitized.details === 'string' ? JSON.parse(sanitized.details) : sanitized.details;
      sanitized.details = this.maskObject(details);
    }

    if (sanitized.requestBody) {
      sanitized.requestBody = this.maskObject(sanitized.requestBody);
    }

    if (sanitized.error) {
      sanitized.error = this.maskString(sanitized.error);
    }

    return sanitized;
  }
}

module.exports = new MaskingEngine({
  denylist: ['cookie', 'set-cookie', 'x-api-key'],
  allowlist: ['traceId', 'spanId', 'serviceName', 'route']
});
