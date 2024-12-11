/**
 * Custom error class for service-related errors.
 */
/**
 * @public
 */
export class ServiceError extends Error {
  public readonly originalError?: Error

  /**
   * Creates an instance of ServiceError.
   * @param message - A descriptive error message.
   * @param originalError - The original error that caused this error.
   */
  constructor(message: string, originalError?: Error) {
    super(message)
    this.name = 'ServiceError'
    this.originalError = originalError

    // Preserve the original stack trace if available
    if (originalError && originalError.stack) {
      this.stack = originalError.stack
    } else {
      Error.captureStackTrace(this, this.constructor)
    }
  }

  // toJSON() {
  //   return {
  //     name: this.name,
  //     message: this.message,
  //     originalError: this.originalError,
  //     stack: this.stack
  //   }
  // }
}
