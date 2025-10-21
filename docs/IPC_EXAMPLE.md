# 📡 Exemplo de IPC (Inter-Process Communication)

Este documento mostra como implementar comunicação segura entre os processos Main e Renderer no Electron.

## 🎯 Arquitetura de Comunicação

```
┌─────────────────┐         ┌──────────────┐         ┌─────────────────┐
│  Renderer       │         │   Preload    │         │     Main        │
│  Process        │────────▶│   Script     │────────▶│   Process       │
│  (renderer.ts)  │  invoke │ (preload.ts) │   IPC   │   (main.ts)     │
└─────────────────┘         └──────────────┘         └─────────────────┘
```

## 📝 Implementação Completa

### 1️⃣ Preload Script (src/preload.ts)

Exponha APIs seguras para o renderer:

```typescript
import { contextBridge, ipcRenderer } from 'electron';

// Exponha APIs seguras através do contextBridge
contextBridge.exposeInMainWorld('electronAPI', {
  // Enviar mensagem para o processo main
  sendMessage: (message: string) => ipcRenderer.send('message-from-renderer', message),
  
  // Invocar e aguardar resposta do processo main
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  
  // Receber mensagens do processo main
  onUpdateMessage: (callback: (message: string) => void) => {
    ipcRenderer.on('update-message', (_event, message) => callback(message));
  },
  
  // Remover listeners (importante para evitar memory leaks)
  removeUpdateListener: () => {
    ipcRenderer.removeAllListeners('update-message');
  },
  
  // Exemplo: Operação com arquivo
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  
  // Exemplo: Salvar dados
  saveData: (data: any) => ipcRenderer.invoke('save-data', data),
  
  // Exemplo: Ler dados
  loadData: () => ipcRenderer.invoke('load-data'),
});
```

### 2️⃣ Main Process (src/main.ts)

Configure os handlers no processo principal:

```typescript
import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'node:path';
import fs from 'node:fs/promises';

// ... código existente do createWindow ...

// Setup IPC Handlers
function setupIPC() {
  // Handler simples: enviar mensagem
  ipcMain.on('message-from-renderer', (_event, message) => {
    console.log('Mensagem recebida do renderer:', message);
    
    // Responder de volta ao renderer
    BrowserWindow.getAllWindows().forEach(win => {
      win.webContents.send('update-message', `Processado: ${message}`);
    });
  });

  // Handler com resposta (invoke/handle)
  ipcMain.handle('get-app-version', () => {
    return app.getVersion();
  });

  // Handler: Abrir diálogo de arquivo
  ipcMain.handle('dialog:openFile', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [
        { name: 'Text Files', extensions: ['txt', 'md'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });
    
    if (canceled) {
      return null;
    }
    
    const filePath = filePaths[0];
    const content = await fs.readFile(filePath, 'utf-8');
    return { path: filePath, content };
  });

  // Handler: Salvar dados
  ipcMain.handle('save-data', async (_event, data) => {
    try {
      const userDataPath = app.getPath('userData');
      const filePath = path.join(userDataPath, 'app-data.json');
      await fs.writeFile(filePath, JSON.stringify(data, null, 2));
      return { success: true, path: filePath };
    } catch (error) {
      console.error('Erro ao salvar dados:', error);
      return { success: false, error: error.message };
    }
  });

  // Handler: Carregar dados
  ipcMain.handle('load-data', async () => {
    try {
      const userDataPath = app.getPath('userData');
      const filePath = path.join(userDataPath, 'app-data.json');
      const content = await fs.readFile(filePath, 'utf-8');
      return { success: true, data: JSON.parse(content) };
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      return { success: false, error: error.message };
    }
  });
}

// Chame setupIPC quando o app estiver pronto
app.on('ready', () => {
  setupIPC();
  createWindow();
});

// ... resto do código ...
```

### 3️⃣ Renderer Process (src/renderer.ts)

Use as APIs expostas no renderer:

```typescript
import './index.css';

// Declare o tipo global (ou crie um arquivo .d.ts separado)
declare global {
  interface Window {
    electronAPI: {
      sendMessage: (message: string) => void;
      getAppVersion: () => Promise<string>;
      onUpdateMessage: (callback: (message: string) => void) => void;
      removeUpdateListener: () => void;
      openFile: () => Promise<{ path: string; content: string } | null>;
      saveData: (data: any) => Promise<{ success: boolean; path?: string; error?: string }>;
      loadData: () => Promise<{ success: boolean; data?: any; error?: string }>;
    };
  }
}

// Exemplos de uso:

// 1. Obter versão do app
async function showAppVersion() {
  const version = await window.electronAPI.getAppVersion();
  console.log('Versão do app:', version);
}

// 2. Enviar mensagem
function sendMessage() {
  window.electronAPI.sendMessage('Olá do Renderer!');
}

// 3. Receber mensagens do Main
window.electronAPI.onUpdateMessage((message) => {
  console.log('Mensagem do Main:', message);
  // Atualizar UI com a mensagem
});

// 4. Abrir arquivo
async function openFileDialog() {
  const result = await window.electronAPI.openFile();
  if (result) {
    console.log('Arquivo:', result.path);
    console.log('Conteúdo:', result.content);
  }
}

// 5. Salvar dados
async function saveAppData() {
  const data = {
    user: 'João',
    settings: { theme: 'dark', language: 'pt-BR' }
  };
  
  const result = await window.electronAPI.saveData(data);
  if (result.success) {
    console.log('Dados salvos em:', result.path);
  } else {
    console.error('Erro ao salvar:', result.error);
  }
}

// 6. Carregar dados
async function loadAppData() {
  const result = await window.electronAPI.loadData();
  if (result.success) {
    console.log('Dados carregados:', result.data);
  } else {
    console.error('Erro ao carregar:', result.error);
  }
}

// Chamar funções quando necessário
showAppVersion();

// Cleanup ao descarregar a página
window.addEventListener('beforeunload', () => {
  window.electronAPI.removeUpdateListener();
});
```

### 4️⃣ TypeScript Definitions (src/types/electron.d.ts)

Crie um arquivo de tipos para melhor IntelliSense:

```typescript
export interface ElectronAPI {
  sendMessage: (message: string) => void;
  getAppVersion: () => Promise<string>;
  onUpdateMessage: (callback: (message: string) => void) => void;
  removeUpdateListener: () => void;
  openFile: () => Promise<{ path: string; content: string } | null>;
  saveData: (data: any) => Promise<{ success: boolean; path?: string; error?: string }>;
  loadData: () => Promise<{ success: boolean; data?: any; error?: string }>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
```

## 🎨 Exemplo Prático de UI

Atualize o `index.html` com botões interativos:

```html
<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>Electron IPC Demo</title>
  </head>
  <body>
    <div class="container">
      <h1>🚀 Electron IPC Demo</h1>
      
      <div class="section">
        <h2>Versão do App</h2>
        <button id="btnVersion">Obter Versão</button>
        <p id="version"></p>
      </div>

      <div class="section">
        <h2>Enviar Mensagem</h2>
        <input type="text" id="messageInput" placeholder="Digite uma mensagem..." />
        <button id="btnSend">Enviar</button>
        <p id="response"></p>
      </div>

      <div class="section">
        <h2>Arquivo</h2>
        <button id="btnOpenFile">Abrir Arquivo</button>
        <pre id="fileContent"></pre>
      </div>

      <div class="section">
        <h2>Dados</h2>
        <button id="btnSave">Salvar Dados</button>
        <button id="btnLoad">Carregar Dados</button>
        <pre id="dataContent"></pre>
      </div>
    </div>

    <script type="module" src="/src/renderer.ts"></script>
  </body>
</html>
```

E adicione os event listeners em `renderer.ts`:

```typescript
// Event Listeners
document.getElementById('btnVersion')?.addEventListener('click', async () => {
  const version = await window.electronAPI.getAppVersion();
  document.getElementById('version')!.textContent = `Versão: ${version}`;
});

document.getElementById('btnSend')?.addEventListener('click', () => {
  const input = document.getElementById('messageInput') as HTMLInputElement;
  window.electronAPI.sendMessage(input.value);
  input.value = '';
});

window.electronAPI.onUpdateMessage((message) => {
  document.getElementById('response')!.textContent = message;
});

document.getElementById('btnOpenFile')?.addEventListener('click', async () => {
  const result = await window.electronAPI.openFile();
  if (result) {
    document.getElementById('fileContent')!.textContent = result.content;
  }
});

document.getElementById('btnSave')?.addEventListener('click', async () => {
  const data = { timestamp: Date.now(), message: 'Teste' };
  const result = await window.electronAPI.saveData(data);
  document.getElementById('dataContent')!.textContent = JSON.stringify(result, null, 2);
});

document.getElementById('btnLoad')?.addEventListener('click', async () => {
  const result = await window.electronAPI.loadData();
  document.getElementById('dataContent')!.textContent = JSON.stringify(result, null, 2);
});
```

## 🔒 Boas Práticas de Segurança

### ✅ FAÇA:
1. Use `contextBridge` para expor APIs
2. Use `ipcRenderer.invoke` para operações assíncronas
3. Valide todas as entradas no processo main
4. Limite as APIs expostas ao mínimo necessário
5. Remova listeners quando não forem mais necessários

### ❌ NÃO FAÇA:
1. Não exponha todo o `ipcRenderer` diretamente
2. Não habilite `nodeIntegration` no renderer
3. Não desabilite `contextIsolation`
4. Não confie em dados vindos do renderer sem validação
5. Não execute código arbitrário enviado pelo renderer

## 📊 Padrões de Comunicação

### 1. Fire and Forget (send/on)
```typescript
// Renderer
ipcRenderer.send('event-name', data);

// Main
ipcMain.on('event-name', (event, data) => {
  // Processar sem enviar resposta
});
```

### 2. Request/Response (invoke/handle)
```typescript
// Renderer
const result = await ipcRenderer.invoke('get-data');

// Main
ipcMain.handle('get-data', async () => {
  return fetchData();
});
```

### 3. Push do Main para Renderer
```typescript
// Main
mainWindow.webContents.send('update', data);

// Renderer
ipcRenderer.on('update', (event, data) => {
  updateUI(data);
});
```

## 🎓 Recursos Adicionais

- [Electron IPC Documentation](https://www.electronjs.org/docs/latest/tutorial/ipc)
- [Context Isolation](https://www.electronjs.org/docs/latest/tutorial/context-isolation)
- [Security Best Practices](https://www.electronjs.org/docs/latest/tutorial/security)

---

**Com IPC você pode criar aplicações Electron poderosas e seguras! 🚀**
