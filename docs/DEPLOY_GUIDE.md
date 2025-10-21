# 📦 Guia de Build e Distribuição

Guia completo para compilar, empacotar e distribuir sua aplicação Electron.

## 🎯 Visão Geral

O Electron Forge facilita todo o processo de build e distribuição com comandos simples:

- `npm start` - Desenvolvimento com hot reload
- `npm run package` - Empacota a aplicação (sem criar instalador)
- `npm run make` - Cria instaladores específicos da plataforma
- `npm run publish` - Publica para um serviço de distribuição

---

## 🔨 Build Local

### Desenvolvimento

```bash
npm start
```

Inicia a aplicação em modo de desenvolvimento com:
- Hot Module Replacement (HMR)
- DevTools aberto automaticamente
- Logs de debug

### Empacotamento

```bash
npm run package
```

Cria uma versão empacotada da aplicação no diretório `out/`:
- Não cria instalador
- Útil para testar antes de distribuir
- Mais rápido que `make`

### Criar Instaladores

```bash
npm run make
```

Gera instaladores específicos da plataforma:

**Windows:**
- `.exe` (Squirrel) - Instalador com auto-update

**macOS:**
- `.zip` - Arquivo compactado do app

**Linux:**
- `.deb` - Pacote Debian (Ubuntu, Mint, etc.)
- `.rpm` - Pacote RPM (Fedora, Red Hat, etc.)

Os instaladores ficam em `out/make/`.

---

## 🎨 Personalização do Build

### Configuração Básica (forge.config.ts)

```typescript
import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerRpm } from '@electron-forge/maker-rpm';

const config: ForgeConfig = {
  packagerConfig: {
    asar: true, // Empacotar código em arquivo ASAR
    icon: './assets/icon', // Ícone do app (sem extensão)
    appBundleId: 'com.mycompany.myapp', // macOS
    appCategoryType: 'public.app-category.productivity', // macOS
    win32metadata: { // Windows
      CompanyName: 'Minha Empresa',
      FileDescription: 'Descrição do App',
      OriginalFilename: 'myapp.exe',
      ProductName: 'Meu App',
      InternalName: 'MyApp',
    },
    osxSign: {}, // Assinatura macOS (requer certificado)
    // osxNotarize: {}, // Notarização macOS (requer conta Apple)
  },
  rebuildConfig: {},
  makers: [
    new MakerSquirrel({
      // Configurações Windows
      authors: 'Minha Empresa',
      description: 'Descrição do app',
    }),
    new MakerZIP({}, ['darwin']),
    new MakerDeb({
      options: {
        maintainer: 'Seu Nome',
        homepage: 'https://seusite.com',
      }
    }),
    new MakerRpm({
      options: {
        homepage: 'https://seusite.com',
      }
    }),
  ],
  plugins: [
    // ... plugins existentes
  ],
};

export default config;
```

### Ícones da Aplicação

Crie uma pasta `assets/` na raiz e adicione os ícones:

**Estrutura:**
```
assets/
├── icon.icns     # macOS (1024x1024)
├── icon.ico      # Windows (256x256)
└── icon.png      # Linux (512x512 ou maior)
```

**Gerando ícones:**

Use ferramentas online ou:
```bash
# macOS
npm install -g icon-gen
icon-gen -i icon.png -o ./assets --icns

# Windows
icon-gen -i icon.png -o ./assets --ico
```

---

## 🌐 Distribuição

### 1. GitHub Releases

#### Configuração

```bash
npm install --save-dev @electron-forge/publisher-github
```

```typescript
// forge.config.ts
import { PublisherGithub } from '@electron-forge/publisher-github';

const config: ForgeConfig = {
  // ... configurações existentes
  publishers: [
    new PublisherGithub({
      repository: {
        owner: 'seu-usuario',
        name: 'seu-repo'
      },
      prerelease: false,
      draft: true
    })
  ]
};
```

#### Publicar

```bash
# Defina o token do GitHub
export GITHUB_TOKEN="seu_token_aqui"

# Publique
npm run publish
```

### 2. Auto-Update (Windows)

O Squirrel já suporta auto-update nativamente:

```typescript
// src/main.ts
import { app } from 'electron';
import { updateElectronApp } from 'update-electron-app';

// Adicione no início do arquivo
updateElectronApp({
  repo: 'seu-usuario/seu-repo',
  updateInterval: '1 hour',
});
```

### 3. Auto-Update (macOS)

```bash
npm install electron-updater
```

```typescript
// src/main.ts
import { autoUpdater } from 'electron-updater';

app.on('ready', () => {
  autoUpdater.checkForUpdatesAndNotify();
});
```

### 4. Distribuição na Web

**Opção 1: Site Próprio**
- Hospede os instaladores em um servidor
- Crie uma página de download
- Use GitHub Releases ou S3

**Opção 2: CDN**
- Cloudflare R2
- AWS S3 + CloudFront
- DigitalOcean Spaces

---

## 🏪 Lojas de Aplicativos

### Microsoft Store

```bash
npm install --save-dev @electron-forge/maker-appx
```

```typescript
import { MakerAppX } from '@electron-forge/maker-appx';

const config: ForgeConfig = {
  makers: [
    new MakerAppX({
      publisher: 'CN=YourPublisher',
      identityName: 'YourApp',
      publisherDisplayName: 'Your Company',
    })
  ]
};
```

### Mac App Store

Requer:
- Conta Apple Developer ($99/ano)
- Certificados de assinatura
- Configuração de sandbox

```typescript
packagerConfig: {
  osxSign: {
    identity: 'Developer ID Application: Your Name (TEAM_ID)',
    'hardened-runtime': true,
    entitlements: 'entitlements.plist',
    'entitlements-inherit': 'entitlements.plist',
  },
  osxNotarize: {
    appleId: process.env.APPLE_ID,
    appleIdPassword: process.env.APPLE_PASSWORD,
  }
}
```

### Snap Store (Linux)

```bash
npm install --save-dev @electron-forge/maker-snap
```

```typescript
import { MakerSnap } from '@electron-forge/maker-snap';

const config: ForgeConfig = {
  makers: [
    new MakerSnap({
      summary: 'Descrição curta',
      description: 'Descrição longa do app',
      categories: ['Utility'],
    })
  ]
};
```

---

## 🔐 Code Signing

### Windows

1. Obtenha certificado de code signing
2. Configure no forge.config.ts:

```typescript
import { windowsSign } from './windowsSign';

packagerConfig: {
  windowsSign: {
    certificateFile: './cert.pfx',
    certificatePassword: process.env.WINDOWS_CERT_PASSWORD,
  }
}
```

### macOS

1. Inscreva-se no Apple Developer Program
2. Gere certificados no Xcode
3. Configure notarização:

```typescript
packagerConfig: {
  osxSign: {
    identity: 'Developer ID Application: Your Name',
  },
  osxNotarize: {
    appleId: process.env.APPLE_ID,
    appleIdPassword: process.env.APPLE_PASSWORD,
    teamId: process.env.APPLE_TEAM_ID,
  }
}
```

---

## 🚀 CI/CD

### GitHub Actions

Crie `.github/workflows/build.yml`:

```yaml
name: Build

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    strategy:
      matrix:
        os: [macos-latest, ubuntu-latest, windows-latest]

    runs-on: ${{ matrix.os }}

    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 18

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run make

      - name: Publish
        if: startsWith(github.ref, 'refs/tags/')
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: npm run publish
```

---

## 📊 Otimização

### Reduzir tamanho do app

1. **Remova dependências não utilizadas:**
```bash
npm prune --production
```

2. **Use ASAR:**
```typescript
packagerConfig: {
  asar: true,
}
```

3. **Ignore arquivos desnecessários:**
```typescript
packagerConfig: {
  ignore: [
    /^\/\.git/,
    /^\/\.vscode/,
    /^\/docs/,
    /^\/\.github/,
    /node_modules\/.*\/test/,
  ]
}
```

4. **Tree shaking no Vite:**
```typescript
// vite.config.ts
export default defineConfig({
  build: {
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: undefined,
      }
    }
  }
});
```

---

## ✅ Checklist de Deploy

- [ ] Ícones criados para todas as plataformas
- [ ] Versão atualizada em `package.json`
- [ ] Informações de copyright/licença configuradas
- [ ] Code signing configurado (produção)
- [ ] Auto-update implementado
- [ ] Testado em todas as plataformas alvo
- [ ] Changelog atualizado
- [ ] README com instruções de instalação
- [ ] Build testado localmente
- [ ] CI/CD configurado (opcional)
- [ ] Políticas de privacidade (se aplicável)
- [ ] Termos de uso (se aplicável)

---

## 🆘 Troubleshooting

### Erro: "Cannot find module"
**Solução:** Verifique se todas as dependências estão instaladas:
```bash
npm ci
```

### Build falha no Windows
**Solução:** Execute o PowerShell como Administrador

### macOS: "App is damaged"
**Solução:** Assine e notarize o app com certificado Apple

### Linux: Permissão negada
**Solução:** Torne o arquivo executável:
```bash
chmod +x out/make/your-app
```

---

## 📚 Recursos

- [Electron Forge Makers](https://www.electronforge.io/config/makers)
- [Electron Forge Publishers](https://www.electronforge.io/config/publishers)
- [Code Signing Guide](https://www.electronjs.org/docs/latest/tutorial/code-signing)
- [Auto-Update Guide](https://www.electronjs.org/docs/latest/tutorial/updates)

---

**Pronto para distribuir seu app! 🎉**
