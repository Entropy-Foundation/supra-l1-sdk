import { describe, it, expect, beforeEach, vi, Mock } from 'vitest'
import { Logger, LogLevel, ILogTransport, ILogObject } from '../logger'

describe('Logger Class', () => {
  let mockTransport: Mock<ILogTransport>
  let logger: Logger

  beforeEach(() => {
    vi.resetAllMocks()
    mockTransport = vi.fn()
    logger = new Logger('WARN', mockTransport)
  })

  describe('Initialization', () => {
    it('should set default log level to WARN', () => {
      const defaultLogger = new Logger('WARN')
      expect((defaultLogger as any)._level).toBe(2) // LOG_LEVELS.WARN = 2
    })

    it('should set the log level correctly when initialized with a specific level', () => {
      const infoLogger = new Logger('INFO')
      expect((infoLogger as any)._level).toBe(1) // LOG_LEVELS.INFO = 1

      const errorLogger = new Logger('ERROR')
      expect((errorLogger as any)._level).toBe(3) // LOG_LEVELS.ERROR = 3
    })
  })

  describe('Setting Transport', () => {
    it('should set the transport function using setTransport', () => {
      const newTransport: ILogTransport = vi.fn()
      logger.setTransport(newTransport)
      expect((logger as any)._transport).toBe(newTransport)
    })
  })

  describe('Setting Log Level', () => {
    it('should update the log level using setLevel', () => {
      logger.setLevel('DEBUG')
      expect((logger as any)._level).toBe(0) // LOG_LEVELS.DEBUG = 0

      logger.setLevel('ERROR')
      expect((logger as any)._level).toBe(3) // LOG_LEVELS.ERROR = 3
    })
  })

  describe('Logging Methods', () => {
    it('should not log DEBUG messages when level is WARN', () => {
      logger.debug('This is a debug message')
      expect(mockTransport).not.toHaveBeenCalled()
    })

    it('should not log INFO messages when level is WARN', () => {
      logger.info('This is an info message')
      expect(mockTransport).not.toHaveBeenCalled()
    })

    it('should log WARN messages when level is WARN', () => {
      logger.warn('This is a warning message')
      expect(mockTransport).toHaveBeenCalledTimes(1)
      const logArg = (mockTransport as Mock<ILogTransport>).mock
        .calls[0][0] as ILogObject
      expect(logArg.level).toBe(2) // LOG_LEVELS.WARN
      expect(logArg.message).toBe('This is a warning message')
      expect(logArg.data).toBeUndefined()
      expect(typeof logArg.timestamp).toBe('number')
    })

    it('should log ERROR messages when level is WARN', () => {
      logger.error('This is an error message', { errorCode: 500 })
      expect(mockTransport).toHaveBeenCalledTimes(1)
      const logArg = (mockTransport as Mock<ILogTransport>).mock
        .calls[0][0] as ILogObject
      expect(logArg.level).toBe(3) // LOG_LEVELS.ERROR
      expect(logArg.message).toBe('This is an error message')
      expect(logArg.data).toEqual({ errorCode: 500 })
      expect(typeof logArg.timestamp).toBe('number')
    })

    it('should log DEBUG and INFO messages when level is DEBUG', () => {
      logger.setLevel('DEBUG')

      logger.debug('Debugging', { step: 1 })
      logger.info('Informational message', { info: 'details' })
      logger.warn('Warning message')
      logger.error('Error message')

      expect(mockTransport).toHaveBeenCalledTimes(4)

      const debugLog = (mockTransport as Mock<ILogTransport>).mock
        .calls[0][0] as ILogObject
      expect(debugLog.level).toBe(0)
      expect(debugLog.message).toBe('Debugging')
      expect(debugLog.data).toEqual({ step: 1 })

      const infoLog = (mockTransport as Mock<ILogTransport>).mock
        .calls[1][0] as ILogObject
      expect(infoLog.level).toBe(1)
      expect(infoLog.message).toBe('Informational message')
      expect(infoLog.data).toEqual({ info: 'details' })

      const warnLog = (mockTransport as Mock<ILogTransport>).mock
        .calls[2][0] as ILogObject
      expect(warnLog.level).toBe(2)
      expect(warnLog.message).toBe('Warning message')
      expect(warnLog.data).toBeUndefined()

      const errorLog = (mockTransport as Mock<ILogTransport>).mock
        .calls[3][0] as ILogObject
      expect(errorLog.level).toBe(3)
      expect(errorLog.message).toBe('Error message')
      expect(errorLog.data).toBeUndefined()
    })
  })

  describe('Handling Missing Transport', () => {
    it('should emit a warning via console.warn when transport is not set', () => {
      const loggerNoTransport = new Logger('INFO')

      const consoleWarnSpy = vi
        .spyOn(console, 'warn')
        .mockImplementation(() => {})

      loggerNoTransport.info('Info without transport')

      expect(consoleWarnSpy).toHaveBeenCalledTimes(1)
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[SupraSDK] logTransport not set. Enable it to receive logs.'
      )
    })

    it('should not emit multiple warnings when transport is not set', () => {
      const loggerNoTransport = new Logger('INFO')

      const consoleWarnSpy = vi
        .spyOn(console, 'warn')
        .mockImplementation(() => {})

      loggerNoTransport.info('First info without transport')
      loggerNoTransport.warn('Second warn without transport')
      loggerNoTransport.error('Third error without transport')

      expect(consoleWarnSpy).toHaveBeenCalledTimes(1)
    })
  })

  describe('Timestamp Validation', () => {
    it('should include a valid timestamp in the log object', () => {
      const fixedTimestamp = 1625097600000
      vi.spyOn(Date, 'now').mockReturnValue(fixedTimestamp)

      logger.warn('Warning with timestamp')

      expect(mockTransport).toHaveBeenCalledTimes(1)
      const logArg = (mockTransport as Mock<ILogTransport>).mock
        .calls[0][0] as ILogObject
      expect(logArg.timestamp).toBe(fixedTimestamp)
    })
  })
})
