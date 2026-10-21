// scripts/after-pack.js
import { existsSync } from 'fs'
import { join } from 'path'
import { execFileSync } from 'child_process'

export default async function (context) {
  console.log('build Python executable file')

  const { electronPlatformName, appOutDir, packager } = context

  // 获取输出目录
  let resourcesPath
  if (electronPlatformName === 'darwin') {
    // macOS: AppName.app/Contents/Resources/
    resourcesPath = join(appOutDir, `${packager.appInfo.productName}.app`, 'Contents', 'Resources')
  } else if (electronPlatformName === 'win32') {
    // Windows: resources/
    resourcesPath = join(appOutDir, 'resources')
  } else if (electronPlatformName === 'linux') {
    // Linux: resources/
    resourcesPath = join(appOutDir, 'resources')
  }

  const distpath = join(resourcesPath, 'dist')
  const projectDir = packager.projectDir ?? process.cwd()
  const pythonExecutable =
    process.platform === 'win32'
      ? join(projectDir, '.venv', 'Scripts', 'python.exe')
      : join(projectDir, '.venv', 'bin', 'python')

  if (!existsSync(pythonExecutable)) {
    throw new Error(`Python virtual environment executable not found: ${pythonExecutable}`)
  }

  execFileSync(
    pythonExecutable,
    [
      '-m',
      'PyInstaller',
      join(projectDir, 'py_src', 'main_http.spec'),
      '--distpath',
      distpath,
      '--workpath',
      join(projectDir, 'out'),
      '-y'
    ],
    {
      cwd: projectDir,
      stdio: 'inherit'
    }
  )
}
