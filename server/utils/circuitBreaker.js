/**
 * Circuit Breaker Pattern
 * Prevents cascading failures by temporarily blocking requests to failing services
 * States: CLOSED (normal) -> OPEN (failing) -> HALF_OPEN (testing) -> CLOSED
 */

const STATE = {
  CLOSED: "CLOSED", // Normal operation, requests pass through
  OPEN: "OPEN", // Service failing, requests blocked
  HALF_OPEN: "HALF_OPEN", // Testing if service recovered
};

class CircuitBreaker {
  constructor(options = {}) {
    this.name = options.name || "Unnamed";
    this.state = STATE.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
    this.nextAttemptTime = null;

    // Configuration
    this.failureThreshold = options.failureThreshold || 5; // Failures before opening
    this.successThreshold = options.successThreshold || 2; // Successes before closing
    this.timeout = options.timeout || 60000; // Time before trying again (60s)
    this.resetTimeout = options.resetTimeout || 30000; // Time to reset consecutive failures

    // Callbacks
    this.onOpen = options.onOpen;
    this.onClose = options.onClose;
    this.onHalfOpen = options.onHalfOpen;
  }

  /**
   * Execute function through circuit breaker
   * @param {Function} fn - Function to execute
   * @returns {Promise} Result from function
   * @throws {Error} If circuit is OPEN
   */
  async execute(fn) {
    // Check if we should open the circuit
    if (this.state === STATE.OPEN) {
      if (Date.now() < this.nextAttemptTime) {
        throw new Error(
          `Circuit breaker "${this.name}" is OPEN. ` +
            `Retry after ${Math.round((this.nextAttemptTime - Date.now()) / 1000)}s`
        );
      }

      // Try half-open state
      this.transitionTo(STATE.HALF_OPEN);
    }

    try {
      const result = await fn();
      this.recordSuccess();
      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  /**
   * Record successful execution
   */
  recordSuccess() {
    this.failureCount = 0;
    this.lastFailureTime = null;

    if (this.state === STATE.HALF_OPEN) {
      this.successCount++;

      if (this.successCount >= this.successThreshold) {
        this.transitionTo(STATE.CLOSED);
      }
    }
  }

  /**
   * Record failed execution
   */
  recordFailure() {
    this.lastFailureTime = Date.now();
    this.successCount = 0;

    if (this.state === STATE.CLOSED) {
      this.failureCount++;

      if (this.failureCount >= this.failureThreshold) {
        this.transitionTo(STATE.OPEN);
      }
    } else if (this.state === STATE.HALF_OPEN) {
      // Any failure in half-open state opens the circuit again
      this.transitionTo(STATE.OPEN);
    }
  }

  /**
   * Transition to new state
   * @private
   */
  transitionTo(newState) {
    if (newState === this.state) return;

    const oldState = this.state;
    this.state = newState;

    console.log(`🔌 Circuit Breaker "${this.name}": ${oldState} → ${newState}`);

    switch (newState) {
      case STATE.CLOSED:
        this.failureCount = 0;
        this.successCount = 0;
        this.nextAttemptTime = null;
        if (this.onClose) this.onClose();
        break;

      case STATE.OPEN:
        this.nextAttemptTime = Date.now() + this.timeout;
        if (this.onOpen) this.onOpen();
        break;

      case STATE.HALF_OPEN:
        this.successCount = 0;
        if (this.onHalfOpen) this.onHalfOpen();
        break;
    }
  }

  /**
   * Get circuit breaker status
   */
  getStatus() {
    return {
      name: this.name,
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
      nextAttemptTime: this.nextAttemptTime,
      config: {
        failureThreshold: this.failureThreshold,
        successThreshold: this.successThreshold,
        timeout: this.timeout,
      },
    };
  }

  /**
   * Reset circuit breaker to CLOSED state
   */
  reset() {
    console.log(`🔄 Resetting circuit breaker "${this.name}"`);
    this.transitionTo(STATE.CLOSED);
  }
}

/**
 * Circuit Breaker Manager
 * Manages multiple circuit breakers
 */
class CircuitBreakerManager {
  constructor() {
    this.breakers = new Map();
  }

  /**
   * Create or get circuit breaker
   */
  getOrCreate(name, options = {}) {
    if (!this.breakers.has(name)) {
      const breaker = new CircuitBreaker({ name, ...options });
      this.breakers.set(name, breaker);
    }
    return this.breakers.get(name);
  }

  /**
   * Execute through circuit breaker
   */
  async execute(name, fn, options = {}) {
    const breaker = this.getOrCreate(name, options);
    return breaker.execute(fn);
  }

  /**
   * Get all breakers status
   */
  getAllStatus() {
    const status = {};
    for (const [name, breaker] of this.breakers) {
      status[name] = breaker.getStatus();
    }
    return status;
  }

  /**
   * Reset all breakers
   */
  resetAll() {
    for (const breaker of this.breakers.values()) {
      breaker.reset();
    }
  }

  /**
   * Reset specific breaker
   */
  reset(name) {
    const breaker = this.breakers.get(name);
    if (breaker) {
      breaker.reset();
    }
  }
}

// Export singleton instance
const manager = new CircuitBreakerManager();

module.exports = {
  CircuitBreaker,
  CircuitBreakerManager,
  manager,
  STATE,
};
