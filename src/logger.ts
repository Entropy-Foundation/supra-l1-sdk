export interface ILogObject {
  level: number
  message: string
  data?: Record<string, unknown>
  timestamp: number
}

/**
 * Log transport function type.
 */
/**
 * @public
 */
export type ILogTransport = (log: ILogObject) => void

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
} as const

/**
 * Log level enumeration.
 */
/**
 * @public
 */
export type LogLevel = keyof typeof LOG_LEVELS

/**
 * Logger class for handling logging with different levels and transports.
 */
export class Logger {
  private _transport?: ILogTransport
  private _level: number = LOG_LEVELS.WARN
  private _noTransportWarned: boolean = false

  /**
   * Constructs a Logger instance.
   * @param level - Logging level.
   * @param transport - Log transport function.
   */
  constructor(level: LogLevel, transport?: ILogTransport) {
    this._transport = transport
    this._level = LOG_LEVELS[level]
  }

  /**
   * Sets the log transport function.
   * @param transport - Log transport function.
   */
  public setTransport(transport: ILogTransport) {
    this._transport = transport
  }

  /**
   * Sets the logging level.
   * @param level - Logging level.
   */
  public setLevel(level: LogLevel) {
    this._level = LOG_LEVELS[level]
  }

  /**
   * Internal log function.
   * @param level - Log level number.
   * @param message - Log message.
   * @param data - Additional log data.
   */
  private _log(level: number, message: string, data?: Record<string, unknown>) {
    if (!this._transport) {
      if (!this._noTransportWarned) {
        console.warn(
          '[SupraSDK] logTransport not set. Enable it to receive logs.'
        )
        this._noTransportWarned = true
      }
      return
    }
    this._transport({
      level,
      message,
      data,
      timestamp: Date.now()
    })
  }

  /**
   * Logs a debug message.
   * @param message - Log message.
   * @param data - Additional log data.
   */
  public debug(message: string, data?: Record<string, unknown>) {
    if (this._level > LOG_LEVELS.DEBUG) return
    this._log(LOG_LEVELS.DEBUG, message, data)
  }

  /**
   * Logs an info message.
   * @param message - Log message.
   * @param data - Additional log data.
   */
  public info(message: string, data?: Record<string, unknown>) {
    if (this._level > LOG_LEVELS.INFO) return
    this._log(LOG_LEVELS.INFO, message, data)
  }

  /**
   * Logs a warning message.
   * @param message - Log message.
   * @param data - Additional log data.
   */
  public warn(message: string, data?: Record<string, unknown>) {
    if (this._level > LOG_LEVELS.WARN) return
    this._log(LOG_LEVELS.WARN, message, data)
  }

  /**
   * Logs an error message.
   * @param message - Log message.
   * @param data - Additional log data.
   */
  public error(message: string, data?: Record<string, unknown>) {
    if (this._level > LOG_LEVELS.ERROR) return
    this._log(LOG_LEVELS.ERROR, message, data)
  }
}
