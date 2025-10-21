export interface ElectronAPI {
  hideWindow: () => void;
  clearInput: () => void;
  resizeWindow: (height: number) => void;
  onClearConversations: (callback: () => void) => () => void;
  onShortcutRegistered?: (callback: (shortcut: string | null) => void) => () => void;
  getActiveShortcut?: () => Promise<string | null>;
  diograndeListar: (params: { numero?: string; palavra?: string; de?: string; ate?: string }) => Promise<unknown>;
  diograndeLerPdf: (url: string) => Promise<{ text: string }>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
