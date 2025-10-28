import { tag } from '../tag'
import { custom } from '../ssch'
import { type Logger } from './interface'
import { type Tag } from '../tag-types'

export const logConfig: {
  backend: Tag.Tag<Logger.Backend, true>
  level: Tag.Tag<Logger.Level, true>
  format: Tag.Tag<Logger.Format, true>
  filePath: Tag.Tag<string, false>
  maxFiles: Tag.Tag<number, true>
  maxSize: Tag.Tag<string, true>
} = {
  backend: tag(custom<Logger.Backend>(), {
    label: 'logger.backend',
    default: 'console' as Logger.Backend
  }),
  level: tag(custom<Logger.Level>(), {
    label: 'logger.level',
    default: 'info' as Logger.Level
  }),
  format: tag(custom<Logger.Format>(), {
    label: 'logger.format',
    default: 'simple' as Logger.Format
  }),
  filePath: tag(custom<string>(), {
    label: 'logger.filePath'
  }),
  maxFiles: tag(custom<number>(), {
    label: 'logger.maxFiles',
    default: 5
  }),
  maxSize: tag(custom<string>(), {
    label: 'logger.maxSize',
    default: '10M'
  })
}
