const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('sim', {
    onSnapshot(callback) {
        ipcRenderer.on('snapshot', (_event, snapshot) => {
            callback(snapshot);
        })
    }
});