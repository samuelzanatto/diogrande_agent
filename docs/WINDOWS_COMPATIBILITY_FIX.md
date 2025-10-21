# 🔧 Correção: "Este aplicativo não pode ser executado em seu PC"

## 📋 Problema Identificado

### Erro no Windows 10:
```
"Este aplicativo não pode ser executado em seu PC

Para localizar uma versão para seu PC, consulte o fornecedor do software."
```

### ❌ Causa Raiz:
Você está compilando o aplicativo em um **Mac com processador ARM64 (Apple Silicon)**. O Electron Forge, por padrão, cria builds para a **mesma arquitetura** da máquina onde está sendo compilado.

**Resultado:** O executável gerado é para **Windows ARM64**, que NÃO é compatível com a maioria dos PCs Windows que usam processadores **Intel/AMD x64** (64-bit) ou **x86** (32-bit).

### 📊 Arquiteturas Windows:

| Arquitetura | Descrição | Uso |
|------------|-----------|-----|
| **x64** | Intel/AMD 64-bit | ✅ **MAIS COMUM** - 90%+ dos PCs Windows |
| **ia32** (x86) | Intel/AMD 32-bit | Sistemas antigos, Windows 7/8/10 32-bit |
| **arm64** | ARM 64-bit | ⚠️ Muito raro - Surface Pro X, alguns laptops específicos |

---

## ✅ Soluções

### **Solução 1: Build para x64 (Recomendado)**

Esta é a solução mais comum e atenderá **90%+ dos usuários Windows**.

#### Comandos atualizados no `package.json`:

```bash
# Build para Windows x64 (64-bit Intel/AMD) - RECOMENDADO
npm run make:win
# ou explicitamente:
npm run make:win:x64

# Build para Windows x86 (32-bit) - Sistemas antigos
npm run make:win:ia32

# Build para Windows ARM64 - Surface Pro X e similares
npm run make:win:arm64

# Build para x64 E x86 ao mesmo tempo
npm run make:win:all
```

#### Como usar:

1. **Limpe builds anteriores:**
   ```bash
   rm -rf out/
   ```

2. **Crie o build para x64:**
   ```bash
   npm run make:win:x64
   ```

3. **Localize o executável:**
   ```
   out/make/squirrel.windows/x64/AgentSesau-Setup.exe
   out/make/zip/win32/x64/AgentSesau-win32-x64-1.0.0.zip
   ```

4. **Teste no Windows 10/11 x64** ✅

---

### **Solução 2: Build em uma Máquina Windows (Ideal)**

Para evitar problemas de cross-compilation, o ideal é fazer o build nativamente em Windows.

#### Opções:

**A) Use uma máquina Windows física ou VM:**
```bash
# No Windows (PowerShell ou CMD):
npm install
npm run make:win
```

**B) Use GitHub Actions para build automático:**

Crie `.github/workflows/build.yml`:

```yaml
name: Build Electron App

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build-windows:
    runs-on: windows-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Build for Windows x64
        run: npm run make:win:x64
        env:
          GROQ_API_KEY: ${{ secrets.GROQ_API_KEY }}
      
      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: windows-x64-installer
          path: out/make/squirrel.windows/x64/*.exe

  build-mac:
    runs-on: macos-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Build for macOS
        run: npm run make:mac
        env:
          GROQ_API_KEY: ${{ secrets.GROQ_API_KEY }}
      
      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: macos-installer
          path: out/make/zip/darwin/**/*.zip
```

---

### **Solução 3: Build Universal (x64 + ia32)**

Para cobrir **99%** dos PCs Windows:

```bash
npm run make:win:all
```

Isso gerará builds para:
- **x64** - Windows 10/11 64-bit (maioria)
- **ia32** - Windows 7/8/10 32-bit (sistemas antigos)

---

## 🔍 Como Verificar a Arquitetura do PC Windows de Destino

### No Windows 10/11:

**Método 1 - Configurações:**
1. Abra **Configurações** (Windows + I)
2. Vá em **Sistema** > **Sobre**
3. Procure por **"Tipo de sistema"**:
   - `Sistema operacional de 64 bits, processador baseado em x64` → Use **x64**
   - `Sistema operacional de 32 bits, processador baseado em x86` → Use **ia32**
   - `Sistema operacional de 64 bits, processador baseado em ARM` → Use **arm64** (raro)

**Método 2 - PowerShell:**
```powershell
# Ver arquitetura do processador
$env:PROCESSOR_ARCHITECTURE
# Resultado: AMD64 = x64, x86 = ia32, ARM64 = arm64

# Ver tipo de sistema operacional
systeminfo | findstr /B /C:"Tipo de Sistema"
```

---

## 📦 Estrutura de Saída Esperada

Após executar `npm run make:win:x64`:

```
out/
├── make/
│   ├── squirrel.windows/
│   │   └── x64/
│   │       ├── AgentSesau-Setup.exe         ← INSTALADOR (recomendado)
│   │       ├── AgentSesau-1.0.0 full.nupkg
│   │       └── RELEASES
│   └── zip/
│       └── win32/
│           └── x64/
│               └── AgentSesau-win32-x64-1.0.0.zip  ← ZIP PORTÁTIL
└── AgentSesau-win32-x64/  ← App empacotado (não distribuir)
```

---

## 🧪 Testando o Build

### 1. Transferir para Windows:
- Copie `AgentSesau-Setup.exe` para o PC Windows
- Ou use `AgentSesau-win32-x64-1.0.0.zip` (versão portátil)

### 2. Executar no Windows:
- **Instalador:** Duplo clique em `AgentSesau-Setup.exe`
- **Portátil:** Extraia o ZIP e execute `AgentSesau.exe`

### 3. Possíveis avisos:
**"O Windows protegeu seu PC":**
- Clique em **"Mais informações"**
- Clique em **"Executar assim mesmo"**
- Isso acontece porque o app não está assinado digitalmente

---

## 🔐 Assinatura de Código (Opcional)

Para evitar o aviso "O Windows protegeu seu PC", você precisa assinar o código:

### 1. Obter um Certificado de Assinatura de Código:
- Compre de: Sectigo, DigiCert, GlobalSign (~$100-300/ano)
- Ou use certificado auto-assinado (apenas para testes internos)

### 2. Configurar no `forge.config.ts`:

```typescript
import { MakerSquirrel } from '@electron-forge/maker-squirrel';

const config: ForgeConfig = {
  packagerConfig: {
    // ... outras configurações
  },
  makers: [
    new MakerSquirrel({
      name: 'AgentSesau',
      setupIcon: './public/logo.ico',
      setupExe: 'AgentSesau-Setup.exe',
      noMsi: true,
      // Assinatura de código
      certificateFile: './path/to/cert.pfx',
      certificatePassword: process.env.WINDOWS_CERT_PASSWORD,
    }),
    // ... outros makers
  ],
};
```

---

## 📝 Resumo dos Comandos Atualizados

```bash
# Desenvolvimento
npm start                  # Executar em modo de desenvolvimento

# Build Windows
npm run make:win          # Windows x64 (padrão - recomendado)
npm run make:win:x64      # Windows x64 explícito
npm run make:win:ia32     # Windows 32-bit (sistemas antigos)
npm run make:win:arm64    # Windows ARM64 (Surface Pro X)
npm run make:win:all      # Windows x64 + ia32

# Build macOS
npm run make:mac          # macOS (apenas no Mac)

# Build multiplataforma
npm run make:all          # Windows x64 + macOS

# Limpar builds anteriores
rm -rf out/
```

---

## ⚠️ Notas Importantes

1. **Cross-compilation do Mac para Windows:**
   - ✅ Funciona bem para x64/ia32
   - ⚠️ Alguns módulos nativos podem não funcionar corretamente
   - 💡 Sempre teste o executável em uma máquina Windows real

2. **Módulos nativos:**
   - Se você usa módulos nativos (C++), pode precisar de `electron-rebuild`
   - Considere usar `@electron/rebuild` para recompilar

3. **Tamanho do instalador:**
   - x64: ~150-200 MB
   - ia32: ~150-200 MB
   - Se criar ambos, terá ~300-400 MB no total

4. **Windows 11:**
   - Windows 11 usa a mesma arquitetura x64
   - O mesmo build funciona em Windows 10 e 11

---

## 🆘 Resolução de Problemas

### "Ainda recebo o erro após fazer o build x64"

1. **Verifique a arquitetura do build:**
   ```bash
   # No Mac:
   ls -lh out/make/squirrel.windows/
   # Deve mostrar a pasta x64/ (não arm64/)
   ```

2. **Confirme que limpou builds anteriores:**
   ```bash
   rm -rf out/
   npm run make:win:x64
   ```

3. **Verifique se o PC Windows é realmente x64:**
   - Veja a seção "Como Verificar a Arquitetura"

### "O build está muito lento no Mac"

- Cross-compilation pode ser lenta
- Considere usar GitHub Actions ou uma VM Windows
- Use SSD e pelo menos 8 GB de RAM

### "Erro durante o build"

```bash
# Limpe tudo e reinstale:
rm -rf node_modules out/ .vite/
npm install
npm run make:win:x64
```

---

## 📚 Referências

- [Electron Forge Documentation](https://www.electronforge.io/)
- [Electron Windows ARM Guide](https://www.electronjs.org/docs/latest/tutorial/windows-arm)
- [Electron Packaging Guide](https://www.electronjs.org/docs/latest/tutorial/application-distribution)
- [Windows on ARM Documentation](https://learn.microsoft.com/en-us/windows/arm/)

---

## ✅ Checklist Final

Antes de distribuir:

- [ ] Build criado para arquitetura correta (x64)
- [ ] Testado em máquina Windows 10/11 real
- [ ] Ícone aparece corretamente
- [ ] Instalador funciona sem erros
- [ ] App abre e funciona normalmente
- [ ] API do Groq configurada corretamente
- [ ] Atalhos globais funcionam
- [ ] Iniciar com sistema funciona (se aplicável)
- [ ] Bandeja do sistema funciona
- [ ] (Opcional) Código assinado para evitar avisos

---

**Status:** ✅ Problema identificado e soluções implementadas!

**Próximo passo:** Execute `npm run make:win:x64` e teste o novo instalador no Windows.
