import { app, ipcMain } from 'electron'
import { spawn, type ChildProcess, type SpawnOptions } from 'child_process'
// import { existsSync } from 'fs'
import path from 'path'
import { stripVTControlCharacters } from 'node:util'

import logger from './logger'

const PY_MODULE = 'main_http'
const STARTUP_TIMEOUT_MS = 30_000

let pythonProcess: ChildProcess | null = null
let serverUrl: string | null = null
let serverStartPromise: Promise<string> | null = null

function startPythonServer(): ChildProcess {
  const appPath = app.getAppPath()
  const options: SpawnOptions = {
    cwd: app.isPackaged ? process.resourcesPath : appPath,
    windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe']
  }

  if (app.isPackaged) {
    const executable = process.platform === 'win32' ? `${PY_MODULE}.exe` : PY_MODULE
    const binaryPath = path.join(process.resourcesPath, 'dist', PY_MODULE, executable)
    logger.info(`Starting Python service: ${binaryPath}`)
    return spawn(binaryPath, [], options)
  }

  const scriptPath = path.join(appPath, 'py_src', `${PY_MODULE}.py`)
  const virtualEnvPython =
    process.platform === 'win32'
      ? path.join(appPath, '.venv', 'Scripts', 'python.exe')
      : path.join(appPath, '.venv', 'bin', 'python')
  const pythonExecutable = virtualEnvPython
  // const pythonExecutable = existsSync(virtualEnvPython)
  //   ? virtualEnvPython
  //   : process.platform === 'win32' ? 'python' : 'python3'

  logger.info(`Starting Python service: ${pythonExecutable} ${scriptPath}`)
  return spawn(pythonExecutable, [scriptPath], options)
}

function getPythonServerUrl(): Promise<string> {
  if (pythonProcess && serverUrl) return Promise.resolve(serverUrl)
  if (serverStartPromise) return serverStartPromise

  let processRef: ChildProcess
  try {
    processRef = startPythonServer()
  } catch (error) {
    return Promise.reject(error)
  }

  pythonProcess = processRef
  serverStartPromise = new Promise<string>((resolve, reject) => {
    let settled = false
    let stdoutBuffer = ''
    let stderrBuffer = ''

    const failToStart = (error: Error): void => {
      if (settled) return
      settled = true
      clearTimeout(startupTimeout)
      serverStartPromise = null
      serverUrl = null
      reject(error)
    }

    const handleLine = (streamName: 'stdout' | 'stderr', line: string): void => {
      const cleanLine = stripVTControlCharacters(line).trim()
      if (!cleanLine) return
      logger.info(`[Python ${streamName}] ${cleanLine}`)

      const match = cleanLine.match(/Uvicorn running on http:\/\/(?:127\.0\.0\.1|localhost):(\d+)/i)
      if (match && !settled) {
        serverUrl = `http://127.0.0.1:${match[1]}`
        settled = true
        clearTimeout(startupTimeout)
        logger.info(`Python service listening at ${serverUrl}`)
        resolve(serverUrl)
      }
    }

    const readLines = (streamName: 'stdout' | 'stderr', data: Buffer): void => {
      let pending = streamName === 'stdout' ? stdoutBuffer : stderrBuffer
      pending += data.toString('utf8')
      const lines = pending.split(/\r?\n/)
      pending = lines.pop() ?? ''
      if (streamName === 'stdout') stdoutBuffer = pending
      else stderrBuffer = pending
      for (const line of lines) handleLine(streamName, line)
    }

    const startupTimeout = setTimeout(() => {
      processRef.kill()
      pythonProcess = null
      failToStart(
        new Error(`Python service did not report a listening port within ${STARTUP_TIMEOUT_MS} ms`)
      )
    }, STARTUP_TIMEOUT_MS)

    processRef.stdout?.on('data', (data: Buffer) => readLines('stdout', data))
    processRef.stderr?.on('data', (data: Buffer) => readLines('stderr', data))
    processRef.once('error', (error) => {
      logger.error('Failed to start Python service', error)
      if (pythonProcess === processRef) pythonProcess = null
      failToStart(error)
    })
    processRef.once('exit', (code, signal) => {
      logger.info(`Python service exited (code=${code}, signal=${signal ?? 'none'})`)
      if (pythonProcess === processRef) {
        pythonProcess = null
        serverUrl = null
        serverStartPromise = null
      }
      if (!settled) {
        failToStart(
          new Error(
            `Python service exited before startup (code=${code}, signal=${signal ?? 'none'})`
          )
        )
      }
    })
  })

  return serverStartPromise
}

export const serverHandler = (): void => {
  void getPythonServerUrl().catch((error) => {
    logger.error('Python service startup failed', error)
  })

  app.on('before-quit', () => {
    if (pythonProcess && !pythonProcess.killed) {
      logger.info('Stopping Python service')
      pythonProcess.kill()
    }
  })

  ipcMain.handle('server:base-url', () => getPythonServerUrl())
}
