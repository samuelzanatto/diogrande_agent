import { app, BrowserWindow, globalShortcut, screen, ipcMain, Tray, Menu, nativeImage } from 'electron';
import https from 'node:https';
import pdf from 'pdf-parse-new';
import path from 'node:path';
import fs from 'node:fs';
import started from 'electron-squirrel-startup';

declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string | undefined;
declare const MAIN_WINDOW_VITE_NAME: string;

const WINDOW_WIDTH = 700;
const WINDOW_MIN_HEIGHT = 130;
const WINDOW_MAX_HEIGHT = 520;

// HTTPS agent (TLS com cadeia incompleta)
const httpsAgent = new https.Agent({ rejectUnauthorized: false });

export const DEFAULT_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
  Accept: 'application/json, text/javascript, */*; q=0.01',
  'X-Requested-With': 'XMLHttpRequest',
};

function httpsGet(urlStr: string, headers?: Record<string, string>): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(urlStr);
    const options: https.RequestOptions = {
      protocol: urlObj.protocol,
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: headers ?? {},
      agent: httpsAgent,
      rejectUnauthorized: false,
    } as https.RequestOptions & { rejectUnauthorized?: boolean };

    const req = https.request(options, (res) => {
      if (!res.statusCode || res.statusCode < 200 || res.statusCode >= 300) {
        reject(new Error(`HTTP ${res.statusCode} ao acessar ${urlStr}`));
        return;
      }
      const chunks: Buffer[] = [];
      res.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    });

    req.on('error', reject);
    req.end();
  });
}

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let activeShortcut: string | null = null;
let lastShowTimestamp = 0;

const createTray = () => {
  // Create tray icon - tenta múltiplos caminhos
  let iconPath = path.join(__dirname, '../renderer/main_window/logo.png');
  
  // Fallback para desenvolvimento
  if (!fs.existsSync(iconPath)) {
    iconPath = path.join(__dirname, '../../public/logo.png');
  }
  
  const trayIcon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });
  
  tray = new Tray(trayIcon);
  
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Mostrar Agente',
      click: () => {
        if (mainWindow) {
          toggleWindow();
        }
      }
    },
    {
      label: `Atalho: ${activeShortcut || 'Carregando...'}`,
      enabled: false
    },
    { type: 'separator' },
    {
      label: 'Iniciar com o sistema',
      type: 'checkbox',
      checked: app.getLoginItemSettings().openAtLogin,
      click: (menuItem) => {
        app.setLoginItemSettings({
          openAtLogin: menuItem.checked,
          openAsHidden: true // Inicia minimizado na bandeja
        });
      }
    },
    { type: 'separator' },
    {
      label: 'Sair',
      click: () => {
        app.quit();
      }
    }
  ]);
  
  tray.setToolTip('Agente de IA');
  tray.setContextMenu(contextMenu);
  
  // Click on tray icon shows window
  tray.on('click', () => {
    if (mainWindow) {
      toggleWindow();
    }
  });
};

const updateTrayMenu = () => {
  if (!tray) return;
  
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Mostrar Agente',
      click: () => {
        if (mainWindow) {
          toggleWindow();
        }
      }
    },
    {
      label: `Atalho: ${activeShortcut || 'Nenhum'}`,
      enabled: false
    },
    { type: 'separator' },
    {
      label: 'Iniciar com o sistema',
      type: 'checkbox',
      checked: app.getLoginItemSettings().openAtLogin,
      click: (menuItem) => {
        app.setLoginItemSettings({
          openAtLogin: menuItem.checked,
          openAsHidden: true
        });
      }
    },
    { type: 'separator' },
    {
      label: 'Sair',
      click: () => {
        app.quit();
      }
    }
  ]);
  
  tray.setContextMenu(contextMenu);
};

const createWindow = () => {
  // Get primary display dimensions
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;

  // Calculate center position
  const x = Math.floor((screenWidth - WINDOW_WIDTH) / 2);
  const y = Math.floor(screenHeight * 0.3); // 30% from top

  // Create the floating browser window
  mainWindow = new BrowserWindow({
    width: WINDOW_WIDTH,
    height: WINDOW_MIN_HEIGHT,
    x,
    y,
    frame: false, // Remove window frame
    transparent: true, // Enable transparency
    alwaysOnTop: true, // Always stay on top
    resizable: false,
    movable: true,
    focusable: true,
    acceptFirstMouse: true,
    minimizable: false,
    maximizable: false,
    skipTaskbar: true, // Don't show in taskbar/dock when minimized
    hasShadow: false,
    backgroundColor: '#00000000',
    show: false, // Start hidden
    useContentSize: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Load the app
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }

  if (mainWindow) {
    // Allow the overlay to appear above full-screen spaces instead of jumping to Desktop
    mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    mainWindow.setAlwaysOnTop(true, 'status');
    mainWindow.setFocusable(true);
    mainWindow.setIgnoreMouseEvents(false);
    mainWindow.setFullScreenable(false);

    mainWindow.webContents.once('did-finish-load', () => {
      if (activeShortcut) {
        mainWindow?.webContents.send('shortcut-registered', activeShortcut);
      }
    });
  }

  // Hide window when it loses focus
  mainWindow.on('blur', () => {
    const sinceShow = Date.now() - lastShowTimestamp;
    console.log('🙈 Janela perdeu foco', {
      sinceShow,
      visible: mainWindow?.isVisible(),
    });

    if (sinceShow < 250) {
      console.log('⏳ Ignorando blur logo após mostrar a janela');
      return;
    }

    if (mainWindow && !mainWindow.webContents.isDevToolsOpened()) {
      mainWindow.hide();
      // Enviar sinal para limpar as conversas
      mainWindow.webContents.send('clear-conversations');
    }
  });

  // Re-register shortcut when window is shown to ensure it's working
  mainWindow.on('show', () => {
    lastShowTimestamp = Date.now();
    if (activeShortcut && !globalShortcut.isRegistered(activeShortcut)) {
      console.log('🔄 Re-registrando atalho ao mostrar janela...');
      registerGlobalShortcut();
    }
    
    // Log window state for debugging
    const bounds = mainWindow?.getBounds();
    console.log('📍 Janela mostrada:', {
      bounds,
      visible: mainWindow?.isVisible(),
      alwaysOnTop: mainWindow?.isAlwaysOnTop(),
      opacity: mainWindow?.getOpacity()
    });
  });

  // Open DevTools in development
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }
};

// Toggle window visibility
const toggleWindow = () => {
  if (!mainWindow) return;

  if (mainWindow.isVisible()) {
    mainWindow.hide();
  } else {
    lastShowTimestamp = Date.now();
    // Recalculate window position to ensure it's on screen
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;
    const x = Math.floor((screenWidth - WINDOW_WIDTH) / 2);
    const y = Math.floor(screenHeight * 0.3);
    
    // Set position before showing
    mainWindow.setPosition(x, y);
    
    // Ensure window properties are correct
    mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    mainWindow.setAlwaysOnTop(true, 'status');
    mainWindow.setFocusable(true);
    mainWindow.setIgnoreMouseEvents(false);
    mainWindow.setOpacity(1.0); // Ensure full opacity
    
    // Show and focus
    mainWindow.show();
    mainWindow.focus();
    mainWindow.moveTop();
    
    // Force the window to come to front on macOS
    if (process.platform === 'darwin') {
      app.focus({ steal: true });
    }
    
    // Ensure webContents is focused
    mainWindow.webContents.focus();
    
    console.log('🪟 Janela mostrada na posição:', { x, y, visible: mainWindow.isVisible(), opacity: mainWindow.getOpacity() });
  }
};

const registerGlobalShortcut = () => {
  globalShortcut.unregisterAll();

  const envShortcut = process.env.AGENT_SHORTCUT?.trim();
  const platformCandidates = process.platform === 'darwin'
    ? ['Command+Shift+Space', 'CommandOrControl+Shift+Space', 'Command+Shift+K']
    : ['Ctrl+Shift+Space', 'CommandOrControl+Shift+Space', 'Alt+Shift+Space'];
  const fallbackOption = 'CommandOrControl+Shift+L';
  const extraFallback = 'CommandOrControl+Alt+Space';

  const candidates = [envShortcut, ...platformCandidates, fallbackOption, extraFallback].filter(
    (value, index, self): value is string => Boolean(value) && self.indexOf(value) === index,
  );

  for (const candidate of candidates) {
    try {
      const registered = globalShortcut.register(candidate, () => {
        console.log(`⌨️  Atalho ${candidate} pressionado!`);
        toggleWindow();
      });

      if (registered) {
        activeShortcut = candidate;
        console.log(`🎯 Atalho global registrado: ${candidate}`);
        if (mainWindow) {
          mainWindow.webContents.send('shortcut-registered', activeShortcut);
        }
        updateTrayMenu(); // Atualiza menu da bandeja com o atalho
        return;
      }

      console.warn(`⚠️  Não foi possível registrar o atalho ${candidate}`);
    } catch (error) {
      console.error(`Erro ao registrar o atalho ${candidate}:`, error);
    }
  }

  activeShortcut = null;
  console.error('❌ Nenhum atalho global pôde ser registrado. Verifique se o atalho não está em uso pelo sistema.');
  if (mainWindow) {
    mainWindow.webContents.send('shortcut-registered', activeShortcut);
  }
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', () => {
  createTray();
  createWindow();
  registerGlobalShortcut();
  
  // Re-register shortcut every 5 seconds to ensure it stays active
  setInterval(() => {
    if (!globalShortcut.isRegistered(activeShortcut || '')) {
      console.log('🔄 Atalho não está mais registrado, re-registrando...');
      registerGlobalShortcut();
    }
  }, 5000);
});

// IPC handlers
ipcMain.on('hide-window', () => {
  if (mainWindow) {
    mainWindow.hide();
  }
});

ipcMain.on('clear-input', () => {
  // Can be used for additional cleanup logic
  console.log('Input cleared');
});

ipcMain.on('resize-window', (_event, requestedHeight: number) => {
  if (!mainWindow) {
    return;
  }

  const boundedHeight = Math.max(
    WINDOW_MIN_HEIGHT,
    Math.min(Math.floor(requestedHeight), WINDOW_MAX_HEIGHT),
  );

  mainWindow.setSize(WINDOW_WIDTH, boundedHeight, true);
});

// IPC: buscar diários recentes (executa no processo main para evitar APIs Node no renderer)
ipcMain.handle(
  'diogrande:listar',
  async (
    _event,
    { numero, palavra, de, ate }: { numero?: string; palavra?: string; de?: string; ate?: string },
  ) => {
    const searchParams = new URLSearchParams({
      action: 'edicoes_json',
      palavra: palavra ?? '',
      numero: numero ?? '',
      de: de ?? '',
      ate: ate ?? '',
    });
    const url = `https://diogrande.campogrande.ms.gov.br/wp-admin/admin-ajax.php?${searchParams.toString()}`;
    const buf = await httpsGet(url, DEFAULT_HEADERS);
    const text = buf.toString('utf8');
    try {
      return JSON.parse(text);
    } catch (err) {
      throw new Error('Resposta inválida do servidor de diários oficiais');
    }
  },
);

// IPC: ler PDF (download e parsing no main)
ipcMain.handle('diogrande:lerPdf', async (_event, { url }: { url: string }) => {
  const headers = { ...DEFAULT_HEADERS, Accept: 'application/pdf' };
  const buffer = await httpsGet(url, headers);
  type PdfData = { text: string };
  const parsed = (await (pdf as unknown as (buf: Buffer) => Promise<PdfData>)(buffer)) as PdfData;
  return { text: parsed.text };
});

// Não encerrar o app quando todas as janelas forem fechadas (continua na bandeja)
app.on('window-all-closed', () => {
  // Não fazer nada - app continua rodando na bandeja
});

app.on('activate', () => {
  // On macOS re-create window when dock icon is clicked
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
  // Re-register shortcut when app is activated
  if (activeShortcut && !globalShortcut.isRegistered(activeShortcut)) {
    console.log('🔄 Re-registrando atalho ao ativar app...');
    registerGlobalShortcut();
  }
});

// Cleanup shortcuts on quit
app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

// Re-register shortcuts when any browser window gains focus
app.on('browser-window-focus', () => {
  if (activeShortcut && !globalShortcut.isRegistered(activeShortcut)) {
    console.log('🔄 Janela focada, re-registrando atalho...');
    registerGlobalShortcut();
  }
});

ipcMain.handle('get-active-shortcut', () => activeShortcut);
