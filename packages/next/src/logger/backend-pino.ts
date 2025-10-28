import { provide, derive } from '../executor'
import { type Logger } from './interface'
import { logConfig } from './config'
import { type Core } from '../types'

type PinoLogger = {
  debug(message: string): void
  debug(meta: Record<string, unknown>, message: string): void
  info(message: string): void
  info(meta: Record<string, unknown>, message: string): void
  warn(message: string): void
  warn(meta: Record<string, unknown>, message: string): void
  error(message: string): void
  error(meta: Record<string, unknown>, message: string): void
}

type PinoConstructor = (options: Record<string, unknown>) => PinoLogger

const pinoImporter: Core.Executor<PinoConstructor> = provide(async (): Promise<PinoConstructor> => {
  try {
    const moduleName = 'pino'
    const pinoModule = await import(moduleName)
    return pinoModule.default || pinoModule
  } catch {
    throw new Error('Pino package not installed. Install with: npm install pino pino-pretty pino-roll')
  }
})

export const pinoLogger: Core.Executor<Logger.Instance> = derive(
  pinoImporter,
  async (pino, { scope }): Promise<Logger.Instance> => {
    const level = logConfig.level.find(scope) ?? 'info'
    const format = logConfig.format.find(scope) ?? 'simple'
    const filePath = logConfig.filePath.find(scope)
    const maxFiles = logConfig.maxFiles.find(scope) ?? 5
    const maxSize = logConfig.maxSize.find(scope) ?? '10M'

    const options: Record<string, unknown> = { level }

    if (filePath && format !== 'pretty') {
      if (maxFiles > 1) {
        options.transport = {
          target: 'pino-roll',
          options: {
            file: filePath,
            frequency: 'daily',
            size: maxSize,
            limit: { count: maxFiles }
          }
        }
      } else {
        options.transport = {
          target: 'pino/file',
          options: { destination: filePath }
        }
      }
    } else if (filePath && format === 'pretty') {
      options.transport = {
        targets: [
          {
            target: 'pino/file',
            options: { destination: filePath }
          },
          {
            target: 'pino-pretty',
            options: {
              destination: 1,
              colorize: true,
              translateTime: 'SYS:standard'
            }
          }
        ]
      }
    } else if (format === 'pretty') {
      options.transport = {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard'
        }
      }
    }

    const logger = pino(options)

    return {
      debug: (message: string, meta?: Logger.Metadata) => {
        if (meta) {
          logger.debug(meta, message)
        } else {
          logger.debug(message)
        }
      },
      info: (message: string, meta?: Logger.Metadata) => {
        if (meta) {
          logger.info(meta, message)
        } else {
          logger.info(message)
        }
      },
      warn: (message: string, meta?: Logger.Metadata) => {
        if (meta) {
          logger.warn(meta, message)
        } else {
          logger.warn(message)
        }
      },
      error: (message: string, meta?: Logger.Metadata) => {
        if (meta) {
          logger.error(meta, message)
        } else {
          logger.error(message)
        }
      }
    }
  }
)