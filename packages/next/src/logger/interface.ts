export namespace Logger {
  export type Level = 'debug' | 'info' | 'warn' | 'error'
  export type Format = 'json' | 'pretty' | 'simple'
  export type Backend = 'console' | 'pino'

  export type Metadata = Record<string, unknown>

  export interface Instance {
    debug(message: string, meta?: Metadata): void
    info(message: string, meta?: Metadata): void
    warn(message: string, meta?: Metadata): void
    error(message: string, meta?: Metadata): void
  }
}
