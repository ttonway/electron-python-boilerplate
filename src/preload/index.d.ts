import { ElectronAPI } from '@electron-toolkit/preload'
import { RendererApi } from './index'

declare global {
  interface Window {
    electron: ElectronAPI
    api: RendererApi
  }
}
