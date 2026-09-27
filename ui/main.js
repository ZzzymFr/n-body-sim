const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const readline = require('readline');

let simProcess = null;
let mainWindow = null;

function startSimulation() {
    const binary = app.isPackaged
        ? path.join(process.resourcesPath, 'n_body_sim.exe')
        : path.join(__dirname, '../cmake-build-debug/n_body_sim.exe');
    simProcess = spawn(binary, [], {
        windowsHide: true,
        stdio: ['ignore', 'pipe', 'pipe'],
    });

    const lines = readline.createInterface({ input: simProcess.stdout });
    lines.on('line', (line) => {
        const snapshot = JSON.parse(line);
        if (mainWindow) {
            mainWindow.webContents.send('snapshot', snapshot);
        }
    });

    simProcess.stderr.on('data', (chunk) => {
        console.error(chunk.toString());
    });

    simProcess.on('exit', (code) => {
        console.log('模拟进程结束', code);
    });

}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        minWidth: 900,
        minHeight: 640,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
        }
    });
    mainWindow.loadFile(path.join(__dirname, 'demo.html'));
}

app.whenReady().then(() => {
    createWindow();
    startSimulation();
});

app.on('window-all-closed', () => {
    if (simProcess) {
        simProcess.kill();
    }
    app.quit();
});