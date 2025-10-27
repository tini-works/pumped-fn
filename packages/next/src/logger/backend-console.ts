import { provide } from '../executor'
import { type Logger } from './interface'
import { logConfig } from './config'
import { type Core } from '../types'

const levelOrder: Record<Logger.Level, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
}

const shouldLog = (messageLevel: Logger.Level, configLevel: Logger.Level): boolean => {
  return levelOrder[messageLevel] >= levelOrder[configLevel]
}

const formatMessage = (
  level: Logger.Level,
  message: string,
  meta: Logger.Metadata | undefined,
  format: Logger.Format
): string => {
  const timestamp = new Date().toISOString()

  if (format === 'json') {
    return JSON.stringify({ timestamp, level, message, ...meta })
  }

  if (format === 'pretty') {
    const metaStr = meta ? `\n${JSON.stringify(meta, null, 2)}` : ''
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${metaStr}`
  }

  const metaStr = meta ? ` ${JSON.stringify(meta)}` : ''
  return `[${level.toUpperCase()}] ${message}${metaStr}`
}

export const consoleLogger: Core.Executor<Logger.Instance> = provide(({ scope }): Logger.Instance => {
  const level = logConfig.level.find(scope) ?? 'info'
  const format = logConfig.format.find(scope) ?? 'simple'

  return {
    debug: (message: string, meta?: Logger.Metadata) => {
      if (shouldLog('debug', level)) {
        console.debug(formatMessage('debug', message, meta, format))
      }
    },
    info: (message: string, meta?: Logger.Metadata) => {
      if (shouldLog('info', level)) {
        console.info(formatMessage('info', message, meta, format))
      }
    },
    warn: (message: string, meta?: Logger.Metadata) => {
      if (shouldLog('warn', level)) {
        console.warn(formatMessage('warn', message, meta, format))
      }
    },
    error: (message: string, meta?: Logger.Metadata) => {
      if (shouldLog('error', level)) {
        console.error(formatMessage('error', message, meta, format))
      }
    }
  }
})
