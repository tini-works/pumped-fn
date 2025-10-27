import { derive } from '../executor'
import { type Logger } from './interface'
import { logConfig } from './config'
import { consoleLogger } from './backend-console'
import { type Core } from '../types'

export const logger: Core.Executor<Logger.Instance> = derive(
  { console: consoleLogger.lazy },
  async (backends, { scope }): Promise<Logger.Instance> => {
    return await backends.console.resolve()
  }
)
