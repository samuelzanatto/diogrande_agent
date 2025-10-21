# 🔧 APIs Úteis do Electron

Guia de referência rápida para as principais APIs do Electron.

## 📱 App (Processo Main)

### Informações da Aplicação

```typescript
import { app } from 'electron';

// Versão da aplicação
const version = app.getVersion();

// Nome da aplicação
const name = app.getName();

// Diretórios do sistema
const userDataPath = app.getPath('userData');
const documentsPath = app.getPath('documents');
const desktopPath = app.getPath('desktop');
const downloadsPath = app.getPath('downloads');
const tempPath = app.getPath('temp');

// Informações do sistema
const locale = app.getLocale(); // 'pt-BR', 'en-US', etc.
const systemLocale = app.getSystemLocale();
```

### Ciclo de Vida

```typescript
// App pronto
app.whenReady().then(() => {
  createWindow();
});

// Todas as janelas fechadas
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// App ativado (macOS)
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Antes de sair
app.on('before-quit', (event) => {
  // Salvar dados, limpar recursos
});

// App saindo
app.on('will-quit', (event) => {
  // Última chance para cleanup
});
```

---

## 🪟 BrowserWindow

### Criar Janela

```typescript
import { BrowserWindow } from 'electron';

const mainWindow = new BrowserWindow({
  width: 1200,
  height: 800,
  minWidth: 800,
  minHeight: 600,
  
  // Aparência
  title: 'Meu App',
  backgroundColor: '#1e1f22',
  show: false, // Mostrar apenas quando ready-to-show
  
  // Barra de título
  titleBarStyle: 'hidden', // 'default', 'hidden', 'hiddenInset'
  trafficLightPosition: { x: 10, y: 10 }, // macOS
  
  // Frame
  frame: true, // false = sem borda
  transparent: false,
  
  // Ícone
  icon: path.join(__dirname, '../assets/icon.png'),
  
  // WebPreferences
  webPreferences: {
    preload: path.join(__dirname, 'preload.js'),
    contextIsolation: true, // Sempre true!
    nodeIntegration: false, // Sempre false!
    sandbox: true,
    webSecurity: true,
  },
});
```

### Eventos da Janela

```typescript
// Mostrar quando pronto (evita flash branco)
mainWindow.once('ready-to-show', () => {
  mainWindow.show();
});

// Janela fechada
mainWindow.on('closed', () => {
  // Limpar referência
  mainWindow = null;
});

// Janela maximizada/restaurada
mainWindow.on('maximize', () => {
  mainWindow.webContents.send('window-maximized');
});

mainWindow.on('unmaximize', () => {
  mainWindow.webContents.send('window-restored');
});

// Janela em foco
mainWindow.on('focus', () => {
  console.log('Janela focada');
});

mainWindow.on('blur', () => {
  console.log('Janela perdeu foco');
});
```

### Controles de Janela

```typescript
// Mostrar/Ocultar
mainWindow.show();
mainWindow.hide();

// Minimizar/Maximizar/Restaurar
mainWindow.minimize();
mainWindow.maximize();
mainWindow.unmaximize();
mainWindow.restore();

// Fullscreen
mainWindow.setFullScreen(true);
const isFullScreen = mainWindow.isFullScreen();

// Posição e tamanho
mainWindow.setBounds({ x: 100, y: 100, width: 800, height: 600 });
mainWindow.setPosition(100, 100);
mainWindow.setSize(800, 600);
mainWindow.center();

// Sempre no topo
mainWindow.setAlwaysOnTop(true);

// Fechar
mainWindow.close();
```

---

## 🗂️ Dialog

### Diálogos de Arquivo

```typescript
import { dialog } from 'electron';

// Abrir arquivo
const result = await dialog.showOpenDialog({
  title: 'Selecione um arquivo',
  defaultPath: app.getPath('documents'),
  buttonLabel: 'Abrir',
  filters: [
    { name: 'Imagens', extensions: ['jpg', 'png', 'gif'] },
    { name: 'Documentos', extensions: ['pdf', 'doc', 'docx'] },
    { name: 'Todos os arquivos', extensions: ['*'] }
  ],
  properties: ['openFile', 'multiSelections']
});

if (!result.canceled) {
  console.log('Arquivos:', result.filePaths);
}

// Abrir diretório
const dirResult = await dialog.showOpenDialog({
  properties: ['openDirectory']
});

// Salvar arquivo
const saveResult = await dialog.showSaveDialog({
  title: 'Salvar arquivo',
  defaultPath: path.join(app.getPath('documents'), 'arquivo.txt'),
  filters: [
    { name: 'Texto', extensions: ['txt'] }
  ]
});

if (!saveResult.canceled) {
  console.log('Caminho para salvar:', saveResult.filePath);
}
```

### Diálogos de Mensagem

```typescript
// Mensagem simples
dialog.showMessageBox({
  type: 'info', // 'none', 'info', 'error', 'question', 'warning'
  title: 'Título',
  message: 'Mensagem principal',
  detail: 'Detalhes adicionais',
  buttons: ['OK'],
});

// Confirmação
const response = await dialog.showMessageBox({
  type: 'question',
  title: 'Confirmar',
  message: 'Tem certeza?',
  buttons: ['Sim', 'Não'],
  defaultId: 0,
  cancelId: 1,
});

if (response.response === 0) {
  console.log('Usuário confirmou');
}

// Error dialog
dialog.showErrorBox('Erro', 'Algo deu errado!');
```

---

## 🍴 Menu

### Menu da Aplicação

```typescript
import { Menu, MenuItem } from 'electron';

const template = [
  {
    label: 'Arquivo',
    submenu: [
      {
        label: 'Novo',
        accelerator: 'CmdOrCtrl+N',
        click: () => {
          console.log('Novo arquivo');
        }
      },
      {
        label: 'Abrir',
        accelerator: 'CmdOrCtrl+O',
        click: async () => {
          const result = await dialog.showOpenDialog({});
          // ...
        }
      },
      { type: 'separator' },
      {
        label: 'Sair',
        accelerator: 'CmdOrCtrl+Q',
        click: () => {
          app.quit();
        }
      }
    ]
  },
  {
    label: 'Editar',
    submenu: [
      { role: 'undo', label: 'Desfazer' },
      { role: 'redo', label: 'Refazer' },
      { type: 'separator' },
      { role: 'cut', label: 'Recortar' },
      { role: 'copy', label: 'Copiar' },
      { role: 'paste', label: 'Colar' },
      { role: 'selectAll', label: 'Selecionar Tudo' },
    ]
  },
  {
    label: 'Visualizar',
    submenu: [
      { role: 'reload', label: 'Recarregar' },
      { role: 'forceReload', label: 'Recarregar Forçado' },
      { role: 'toggleDevTools', label: 'DevTools' },
      { type: 'separator' },
      { role: 'resetZoom', label: 'Zoom Normal' },
      { role: 'zoomIn', label: 'Aumentar Zoom' },
      { role: 'zoomOut', label: 'Diminuir Zoom' },
      { type: 'separator' },
      { role: 'togglefullscreen', label: 'Tela Cheia' },
    ]
  },
];

const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);
```

### Menu de Contexto

```typescript
// No renderer (via IPC)
window.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  window.electronAPI.showContextMenu();
});

// No main
ipcMain.on('show-context-menu', (event) => {
  const template = [
    { label: 'Copiar', role: 'copy' },
    { label: 'Colar', role: 'paste' },
    { type: 'separator' },
    { label: 'Inspecionar', click: () => {
      event.sender.inspectElement(0, 0);
    }}
  ];
  
  const menu = Menu.buildFromTemplate(template);
  menu.popup();
});
```

---

## 📣 Notificações

```typescript
import { Notification } from 'electron';

// Verificar suporte
if (Notification.isSupported()) {
  const notification = new Notification({
    title: 'Título',
    body: 'Corpo da notificação',
    icon: path.join(__dirname, '../assets/icon.png'),
    silent: false,
    urgency: 'normal', // 'normal', 'critical', 'low'
  });

  notification.on('click', () => {
    console.log('Notificação clicada');
    mainWindow.show();
  });

  notification.show();
}
```

---

## 🌐 Shell

```typescript
import { shell } from 'electron';

// Abrir URL no navegador padrão
await shell.openExternal('https://google.com');

// Abrir arquivo no app padrão
await shell.openPath('/path/to/file.pdf');

// Mostrar arquivo no gerenciador de arquivos
shell.showItemInFolder('/path/to/file.txt');

// Mover arquivo para lixeira
await shell.trashItem('/path/to/file.txt');

// Som de beep
shell.beep();
```

---

## 📋 Clipboard

```typescript
import { clipboard } from 'electron';

// Texto
clipboard.writeText('Hello!');
const text = clipboard.readText();

// HTML
clipboard.writeHTML('<h1>Hello</h1>');
const html = clipboard.readHTML();

// Imagem
const image = nativeImage.createFromPath('/path/to/image.png');
clipboard.writeImage(image);
const clipImage = clipboard.readImage();

// Limpar
clipboard.clear();
```

---

## 🖼️ Tray (Ícone na Bandeja)

```typescript
import { Tray, Menu, nativeImage } from 'electron';

let tray: Tray;

function createTray() {
  const icon = nativeImage.createFromPath(
    path.join(__dirname, '../assets/tray-icon.png')
  );
  
  tray = new Tray(icon);
  
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Mostrar', click: () => mainWindow.show() },
    { label: 'Ocultar', click: () => mainWindow.hide() },
    { type: 'separator' },
    { label: 'Sair', click: () => app.quit() }
  ]);
  
  tray.setToolTip('Meu App');
  tray.setContextMenu(contextMenu);
  
  tray.on('click', () => {
    mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
  });
}
```

---

## 🔌 PowerMonitor

```typescript
import { powerMonitor } from 'electron';

app.whenReady().then(() => {
  // Sistema suspenso
  powerMonitor.on('suspend', () => {
    console.log('Sistema suspenso');
  });

  // Sistema retomado
  powerMonitor.on('resume', () => {
    console.log('Sistema retomado');
  });

  // Na bateria
  powerMonitor.on('on-battery', () => {
    console.log('Usando bateria');
  });

  // Na energia
  powerMonitor.on('on-ac', () => {
    console.log('Usando energia');
  });

  // Verificar estado
  const onBattery = powerMonitor.isOnBatteryPower();
});
```

---

## 🔐 SafeStorage (Criptografia)

```typescript
import { safeStorage } from 'electron';

app.whenReady().then(() => {
  if (safeStorage.isEncryptionAvailable()) {
    // Criptografar
    const encrypted = safeStorage.encryptString('senha123');
    
    // Salvar em arquivo
    fs.writeFileSync('data.enc', encrypted);
    
    // Ler e descriptografar
    const encryptedData = fs.readFileSync('data.enc');
    const decrypted = safeStorage.decryptString(encryptedData);
    console.log(decrypted); // 'senha123'
  }
});
```

---

## 🌍 Session

```typescript
import { session } from 'electron';

// Limpar cache
await session.defaultSession.clearCache();

// Limpar dados de navegação
await session.defaultSession.clearStorageData({
  storages: ['cookies', 'localstorage', 'indexdb']
});

// Cookies
const cookies = await session.defaultSession.cookies.get({});
await session.defaultSession.cookies.set({
  url: 'https://example.com',
  name: 'cookie_name',
  value: 'cookie_value'
});

// User Agent
session.defaultSession.setUserAgent('Custom User Agent');
```

---

## 📚 Recursos Adicionais

- [Electron API Docs](https://www.electronjs.org/docs/latest/api/app)
- [Electron Fiddle](https://www.electronjs.org/fiddle) - Playground interativo
- [Awesome Electron](https://github.com/sindresorhus/awesome-electron)

---

**Explore as APIs e crie aplicações incríveis! 🚀**
