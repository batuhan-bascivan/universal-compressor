import { contextBridge, ipcRenderer, webUtils } from 'electron';

contextBridge.exposeInMainWorld('electron', {
    compressFile: (filePath: string, format: string, outputDir?: string) =>
        ipcRenderer.invoke('compress-file', filePath, format, outputDir),
    showInFolder: (filePath: string) => ipcRenderer.invoke('show-in-folder', filePath),
    selectDirectory: () => ipcRenderer.invoke('select-directory'),
    getFilePath: (file: File) => {
        try {
            if (webUtils && typeof webUtils.getPathForFile === 'function') {
                return webUtils.getPathForFile(file);
            }
        } catch (e) {
            console.error('Error accessing webUtils:', e);
        }
        return (file as File & { path?: string }).path || '';
    },
});
