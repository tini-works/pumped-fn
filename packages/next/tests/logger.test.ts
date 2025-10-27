import { describe, test, expect, vi, beforeEach } from 'vitest'
import { createScope } from '../src/scope'
import { preset } from '../src/executor'
import { logger, logConfig, consoleLogger, type Logger } from '../src/logger'

describe('Logger Module', () => {
  describe('Configuration', () => {
    test('logger is resolvable', async () => {
      const scope = createScope()
      const log = await scope.resolve(logger)

      expect(log).toBeDefined()
      expect(log.info).toBeDefined()
      expect(log.error).toBeDefined()
      expect(log.warn).toBeDefined()
      expect(log.debug).toBeDefined()

      await scope.dispose()
    })

    test('can configure level via tag', async () => {
      const scope = createScope({
        tags: [logConfig.level('debug')]
      })
      const log = await scope.resolve(logger)

      expect(log).toBeDefined()
      await scope.dispose()
    })

    test('can configure format via tag', async () => {
      const scope = createScope({
        tags: [logConfig.format('json')]
      })
      const log = await scope.resolve(logger)

      expect(log).toBeDefined()
      await scope.dispose()
    })
  })

  describe('Console Backend', () => {
    let consoleInfoSpy: ReturnType<typeof vi.spyOn>
    let consoleErrorSpy: ReturnType<typeof vi.spyOn>
    let consoleWarnSpy: ReturnType<typeof vi.spyOn>
    let consoleDebugSpy: ReturnType<typeof vi.spyOn>

    beforeEach(() => {
      consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
      consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {})
    })

    test('logs info messages', async () => {
      const scope = createScope()
      const log = await scope.resolve(consoleLogger)

      log.info('test message')

      expect(consoleInfoSpy).toHaveBeenCalledWith('[INFO] test message')
      await scope.dispose()
    })

    test('logs error messages', async () => {
      const scope = createScope()
      const log = await scope.resolve(consoleLogger)

      log.error('error message')

      expect(consoleErrorSpy).toHaveBeenCalledWith('[ERROR] error message')
      await scope.dispose()
    })

    test('logs warn messages', async () => {
      const scope = createScope()
      const log = await scope.resolve(consoleLogger)

      log.warn('warning message')

      expect(consoleWarnSpy).toHaveBeenCalledWith('[WARN] warning message')
      await scope.dispose()
    })

    test('respects log level filtering', async () => {
      const scope = createScope({
        tags: [logConfig.level('error')]
      })
      const log = await scope.resolve(consoleLogger)

      log.info('should not log')
      log.error('should log')

      expect(consoleInfoSpy).not.toHaveBeenCalled()
      expect(consoleErrorSpy).toHaveBeenCalledWith('[ERROR] should log')
      await scope.dispose()
    })

    test('logs metadata', async () => {
      const scope = createScope()
      const log = await scope.resolve(consoleLogger)

      log.info('message with meta', { userId: '123', action: 'login' })

      expect(consoleInfoSpy).toHaveBeenCalledWith('[INFO] message with meta {"userId":"123","action":"login"}')
      await scope.dispose()
    })

    test('formats JSON output', async () => {
      const scope = createScope({
        tags: [logConfig.format('json')]
      })
      const log = await scope.resolve(consoleLogger)

      log.info('json message', { key: 'value' })

      const call = consoleInfoSpy.mock.calls[0][0]
      const parsed = JSON.parse(call)
      expect(parsed.level).toBe('info')
      expect(parsed.message).toBe('json message')
      expect(parsed.key).toBe('value')
      await scope.dispose()
    })
  })

  describe('Lazy Loading', () => {
    test('only resolves selected backend', async () => {
      const scope = createScope()

      const log = await scope.resolve(logger)
      expect(log).toBeDefined()

      await scope.dispose()
    })
  })

  describe('Testing with preset()', () => {
    test('can mock logger for testing', async () => {
      const mockLogger: Logger.Instance = {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn()
      }

      const scope = createScope({
        initialValues: [preset(consoleLogger, mockLogger)]
      })

      const log = await scope.resolve(consoleLogger)

      expect(log).toBe(mockLogger)
      log.info('test')

      expect(mockLogger.info).toHaveBeenCalledWith('test')
      await scope.dispose()
    })
  })

  describe('Level Ordering', () => {
    let consoleInfoSpy: ReturnType<typeof vi.spyOn>
    let consoleErrorSpy: ReturnType<typeof vi.spyOn>
    let consoleWarnSpy: ReturnType<typeof vi.spyOn>
    let consoleDebugSpy: ReturnType<typeof vi.spyOn>

    beforeEach(() => {
      consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
      consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {})
    })

    test('debug level logs all messages', async () => {
      const scope = createScope({
        tags: [logConfig.level('debug')]
      })
      const log = await scope.resolve(consoleLogger)

      log.debug('debug')
      log.info('info')
      log.warn('warn')
      log.error('error')

      expect(consoleDebugSpy).toHaveBeenCalled()
      expect(consoleInfoSpy).toHaveBeenCalled()
      expect(consoleWarnSpy).toHaveBeenCalled()
      expect(consoleErrorSpy).toHaveBeenCalled()
      await scope.dispose()
    })

    test('warn level logs warn and error only', async () => {
      const scope = createScope({
        tags: [logConfig.level('warn')]
      })
      const log = await scope.resolve(consoleLogger)

      log.debug('debug')
      log.info('info')
      log.warn('warn')
      log.error('error')

      expect(consoleDebugSpy).not.toHaveBeenCalled()
      expect(consoleInfoSpy).not.toHaveBeenCalled()
      expect(consoleWarnSpy).toHaveBeenCalled()
      expect(consoleErrorSpy).toHaveBeenCalled()
      await scope.dispose()
    })
  })
})
