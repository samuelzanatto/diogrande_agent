// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  hideWindow: () => ipcRenderer.send('hide-window'),
  clearInput: () => ipcRenderer.send('clear-input'),
  resizeWindow: (height: number) => ipcRenderer.send('resize-window', height),
  // Diogrande APIs via main
  diograndeListar: (params: { numero?: string; palavra?: string; de?: string; ate?: string }) =>
    ipcRenderer.invoke('diogrande:listar', params) as Promise<unknown>,
  diograndeLerPdf: (url: string) => ipcRenderer.invoke('diogrande:lerPdf', { url }) as Promise<{ text: string }>,
  onClearConversations: (callback: () => void) => {
    ipcRenderer.on('clear-conversations', callback);
    return () => ipcRenderer.removeListener('clear-conversations', callback);
  },
  onShortcutRegistered: (callback: (shortcut: string | null) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, shortcut: string | null) => {
      callback(shortcut);
    };
    ipcRenderer.on('shortcut-registered', listener);
    return () => ipcRenderer.removeListener('shortcut-registered', listener);
  },
  getActiveShortcut: () => ipcRenderer.invoke('get-active-shortcut') as Promise<string | null>,
});
