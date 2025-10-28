import { derive } from '../executor'
import { type Logger } from './interface'
import { logConfig } from './config'
import { consoleLogger } from './backend-console'
import { pinoLogger } from './backend-pino'
import { type Core } from '../types'

export const logger: Core.Executor<Logger.Instance> = derive(
  {
    console: consoleLogger.lazy,
    pino: pinoLogger.lazy
  },
  async (backends, { scope }): Promise<Logger.Instance> => {
    const backend = logConfig.backend.find(scope) ?? 'console'

    switch (backend) {
      case 'pino':
        return await backends.pino.resolve()
      default:
        return await backends.console.resolve()
    }
  }
)
