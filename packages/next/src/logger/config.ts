import { tag } from '../tag'
import { custom } from '../ssch'
import { type Logger } from './interface'
import { type Tag } from '../tag-types'

export const logConfig: {
  level: Tag.Tag<Logger.Level, true>
  format: Tag.Tag<Logger.Format, true>
} = {
  level: tag(custom<Logger.Level>(), {
    label: 'logger.level',
    default: 'info' as Logger.Level
  }),
  format: tag(custom<Logger.Format>(), {
    label: 'logger.format',
    default: 'simple' as Logger.Format
  })
}
