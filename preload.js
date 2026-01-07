const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
    on: (channel, callback) => {
        ipcRenderer.on(channel, callback);
    },
    send: (channel, args) => {
        ipcRenderer.send(channel, args);
    },
    // 画像圧縮API
    compressImage: (data) => ipcRenderer.invoke("compress-image", data),
    compressBatch: (data) => ipcRenderer.invoke("compress-batch", data),
    // Electron環境かどうかを判定
    isElectron: true
});
