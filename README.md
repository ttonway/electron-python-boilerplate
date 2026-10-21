# Electron + Python Boilerplate

A starter template for building desktop applications with Electron and Python. The UI is built with React and TypeScript. The Electron main process starts and manages a local FastAPI service, while the renderer obtains the service URL through a preload-exposed IPC API and sends requests to Python.

## Features

- Electron desktop application powered by electron-vite
- React and TypeScript renderer
- Local FastAPI service bound to the loopback interface and an OS-assigned port
- PyInstaller packages the Python service as an executable for distribution with the desktop app
- Build scripts for Windows, macOS, and Linux

## Tech Stack

| Area | Technologies |
| --- | --- |
| Desktop app | Electron 44, electron-vite |
| UI | React 19, TypeScript, Vite |
| Python service | Python, FastAPI, Uvicorn |
| Python packaging | PyInstaller |
| App packaging | electron-builder |

## Prerequisites

- Node.js (the current LTS release is recommended) and npm
- Python 3.10 or newer

## Project Setup

### Install

Install JavaScript dependencies and create a Python virtual environment:

```bash
npm install
python -m venv .venv
```

Activate the virtual environment and install Python dependencies:

```powershell
# Windows PowerShell
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
```

```bash
# macOS / Linux
source .venv/bin/activate
python -m pip install -r requirements.txt
```

### Development

In development, the Electron main process runs `py_src/main_http.py` using Python from `.venv`. Create the virtual environment and install its dependencies before starting the app.

```bash
npm run dev
```

### Build

The build commands run type checks and build the Electron/Vite app. The `electron-builder` `afterPack` hook invokes PyInstaller from the active project virtual environment and places the Python service executable in the app resources.

```bash
# Windows
npm run build:win

# macOS
npm run build:mac

# Linux
npm run build:linux
```

## License

No license has been specified yet. Add a `LICENSE` file that matches your intended use and distribution terms before publishing or reusing this project.
