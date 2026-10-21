import winston from 'winston'
import { app } from 'electron'

const logFormat = winston.format.combine(
  winston.format.splat(),
  winston.format.errors({ stack: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.printf(({ timestamp, level, message, stack }) => {
    if (stack) {
      return `${timestamp}: [${level}] ${message}\n${stack}`
    }
    return `${timestamp}: [${level}] ${message}`
  })
)

const transports: winston.transport[] = [
  new winston.transports.Console({
    format: winston.format.combine(winston.format.colorize(), logFormat)
  })
]

if (process.env.NODE_ENV !== 'production') {
  transports.push(
    new winston.transports.File({
      filename: `./logs/main.log`,
      format: logFormat,
      maxsize: 1024 * 1024 * 10,
      maxFiles: 10
    })
  )
} else {
  transports.push(
    new winston.transports.File({
      filename: `${app.getPath('userData')}/logs/main.log`,
      format: logFormat,
      maxsize: 1024 * 1024 * 10,
      maxFiles: 10
    })
  )
}

const logger = winston.createLogger({
  level: 'debug',
  format: logFormat,
  transports
})

export default logger
