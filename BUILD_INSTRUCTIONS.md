# Instruções de Build - AgentSesau

## Requisitos

- Node.js 16+ instalado
- npm ou yarn
- Para build Windows: Apenas em sistemas Windows ou com Wine configurado
- Para build macOS: Apenas em sistemas macOS

## Configuração Inicial

1. Instale as dependências:
```bash
npm install
```

2. Configure sua chave da API Groq:
```bash
# Linux/macOS
export GROQ_API_KEY="sua_chave_aqui"

# Windows (PowerShell)
$env:GROQ_API_KEY="sua_chave_aqui"

# Windows (CMD)
set GROQ_API_KEY=sua_chave_aqui
```

## Desenvolvimento

Para executar em modo de desenvolvimento:
```bash
npm start
```

## Build para Produção

### Build para macOS (apenas em macOS)
```bash
npm run make:mac
```

Isso irá gerar:
- Um arquivo `.zip` em `out/make/zip/darwin/`
- O app empacotado em `out/AgentSesau-darwin-x64/`

### Build para Windows

⚠️ **IMPORTANTE:** Se você está em um Mac com Apple Silicon (M1/M2/M3), você DEVE especificar a arquitetura de destino!

```bash
# Windows x64 (64-bit) - RECOMENDADO para 90%+ dos PCs Windows
npm run make:win:x64

# Windows ia32 (32-bit) - Para sistemas Windows antigos
npm run make:win:ia32

# Ambos (x64 + ia32) - Cobre 99% dos PCs Windows
npm run make:win:all

# Windows ARM64 - Apenas para Surface Pro X e similares (raro)
npm run make:win:arm64
```

Isso irá gerar:
- Um instalador `.exe` em `out/make/squirrel.windows/x64/`
- Um arquivo `.zip` portátil em `out/make/zip/win32/x64/`
- O app empacotado em `out/AgentSesau-win32-x64/`

**Nota sobre cross-compilation:**
- Builds do Mac para Windows geralmente funcionam bem
- Sempre teste o executável em uma máquina Windows real
- Para builds mais confiáveis, use uma máquina Windows ou GitHub Actions
- Veja `docs/WINDOWS_COMPATIBILITY_FIX.md` para mais detalhes

### Build para ambas as plataformas
```bash
npm run make:all
```

**Nota:** Builds cross-platform podem apresentar problemas. É recomendado fazer o build nativamente em cada plataforma.

## Funcionalidades do App em Produção

### Bandeja do Sistema (System Tray)
- O app fica rodando na bandeja do sistema mesmo quando a janela está fechada
- Clique no ícone da bandeja para mostrar/ocultar a janela
- Clique com botão direito para acessar o menu de contexto

### Iniciar com o Sistema
- Acesse o menu da bandeja (clique direito no ícone)
- Marque "Iniciar com o sistema"
- O app será iniciado automaticamente quando você fizer login
- Inicia minimizado na bandeja

### Atalhos Globais
- **Command+Shift+Space** (macOS) ou **Ctrl+Shift+Space** (Windows)
- Funciona mesmo quando o app está minimizado
- Mostra/oculta a janela instantaneamente

## Distribuição

### macOS
O arquivo `.zip` pode ser extraído e o app `.app` pode ser arrastado para a pasta Applications.

**Instalação:**
1. Baixe o arquivo `.zip`
2. Extraia o arquivo
3. Arraste `AgentSesau.app` para a pasta Applications
4. Na primeira execução, pode ser necessário:
   - Abrir com clique direito > Abrir
   - Ou ir em Preferências do Sistema > Segurança e Privacidade > Permitir

### Windows
O instalador `.exe` instala automaticamente o app.

**Instalação:**
1. Baixe `AgentSesau-Setup.exe`
2. Execute o instalador
3. Siga as instruções na tela
4. O app será instalado em `C:\Users\<usuario>\AppData\Local\AgentSesau`
5. Um atalho será criado no Menu Iniciar

## Resolução de Problemas

### Atalho Global Não Funciona
- Verifique se outro app não está usando o mesmo atalho
- O app tentará atalhos alternativos automaticamente
- Confira o menu da bandeja para ver qual atalho está ativo

### App Não Inicia com o Sistema
- Verifique se a opção está marcada no menu da bandeja
- Em macOS: Verifique em Preferências do Sistema > Usuários e Grupos > Itens de Login
- Em Windows: Verifique no Gerenciador de Tarefas > Inicializar

### Ícone Não Aparece na Bandeja
- Reinicie o app
- Em alguns sistemas, pode ser necessário autorizar o app a rodar em segundo plano

### Build Falha
- Certifique-se de que todas as dependências estão instaladas
- Verifique se os ícones `.ico` e `.icns` existem em `public/`
- Limpe o cache: `rm -rf node_modules out .vite && npm install`

## Estrutura de Arquivos Gerados

```
out/
├── make/
│   ├── zip/darwin/         # macOS - arquivo ZIP
│   │   └── x64/
│   │       └── AgentSesau-darwin-x64-1.0.0.zip
│   └── squirrel.windows/   # Windows - instalador
│       └── x64/
│           └── AgentSesau-Setup.exe
└── AgentSesau-{platform}-{arch}/  # App empacotado
```

## Logs e Debug

Para ver logs de produção:

### macOS
```bash
# Logs do console
~/Library/Logs/AgentSesau/
```

### Windows
```bash
# Logs do console
%USERPROFILE%\AppData\Roaming\AgentSesau\logs\
```

Para debug, abra o DevTools:
- Mantenha pressionado **Command+Option+I** (macOS) ou **Ctrl+Shift+I** (Windows)
