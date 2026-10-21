import Versions from './components/Versions'
import electronLogo from './assets/electron.svg'

import { api } from './api'

function App(): React.JSX.Element {
  // const ipcHandle = (): void => window.electron.ipcRenderer.send('ping')
  const testaddHandle = async (): Promise<void> => {
    try {
      const result = await api.api_add({
        a: 1,
        b: 2
      })
      console.log('api_add result.', result)
    } catch (err) {
      console.error('api_add fail.', err)
    }
  }

  return (
    <>
      <img alt="logo" className="logo" src={electronLogo} />
      <div className="creator">Powered by electron-vite</div>
      <div className="text">
        Build an Electron app with <span className="react">React</span>
        &nbsp;and <span className="ts">TypeScript</span>
      </div>
      <p className="tip">
        Please try pressing <code>F12</code> to open the devTool
      </p>
      <div className="actions">
        <div className="action">
          <a href="https://electron-vite.org/" target="_blank" rel="noreferrer">
            Documentation
          </a>
        </div>
        <div className="action">
          <a target="_blank" rel="noreferrer" onClick={testaddHandle}>
            Test api_add
          </a>
        </div>
      </div>
      <Versions></Versions>
    </>
  )
}

export default App
