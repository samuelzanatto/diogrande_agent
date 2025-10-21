# AgentSesau - Guia de Produção

## ✅ Funcionalidades Implementadas

### 🎯 Bandeja do Sistema (System Tray)
- ✅ Ícone na bandeja do sistema (Windows e macOS)
- ✅ Menu de contexto com opções:
  - Mostrar/Ocultar agente
  - Visualizar atalho ativo
  - Iniciar com o sistema (checkbox)
  - Sair do aplicativo
- ✅ Clique no ícone mostra/oculta a janela
- ✅ App continua rodando em segundo plano quando janela é fechada

### 🚀 Inicialização Automática
- ✅ Opção "Iniciar com o sistema" no menu da bandeja
- ✅ Inicia minimizado na bandeja
- ✅ Funciona em Windows e macOS
- ✅ Estado persistente (lembra da escolha do usuário)

### ⌨️ Atalhos Globais
- ✅ **Command+Shift+Space** (macOS)
- ✅ **Ctrl+Shift+Space** (Windows)
- ✅ Funcionam mesmo com app minimizado
- ✅ Atalhos alternativos automáticos se o principal estiver em uso
- ✅ Re-registro automático a cada 5 segundos

### 📦 Empacotamento
- ✅ Build para macOS (arquivo .zip com .app)
- ✅ Build para Windows (instalador .exe)
- ✅ Ícones customizados (.icns para Mac, .ico para Windows)
- ✅ Configuração completa no forge.config.ts

## 📁 Arquivos Gerados

### macOS
```
out/make/zip/darwin/arm64/AgentSesau-darwin-arm64-1.0.0.zip
```
- Tamanho: ~107 MB
- Contém: AgentSesau.app
- Instalação: Extrair e arrastar para /Applications

### Windows (quando compilado em Windows)
```
out/make/squirrel.windows/x64/AgentSesau-Setup.exe
```
- Instalador completo
- Cria atalhos automaticamente
- Desinstalador incluído

## 🎨 Ícones

Ícones gerados automaticamente a partir de `public/logo.png`:

- ✅ `public/logo.icns` - macOS (múltiplas resoluções: 16x16 até 1024x1024)
- ✅ `public/logo.ico` - Windows (múltiplas resoluções)

## 🔧 Comandos de Build

```bash
# Desenvolvimento
npm start

# Empacotar sem criar instalador
npm run package

# Criar instalador para macOS (apenas em macOS)
npm run make:mac

# Criar instalador para Windows (apenas em Windows)
npm run make:win

# Tentar criar para ambos
npm run make:all
```

## 📋 Checklist de Distribuição

Antes de distribuir para outros computadores:

### Comum (Windows e macOS)
- [ ] Variável de ambiente `GROQ_API_KEY` configurada (ou hardcoded no código)
- [ ] Testado o atalho global
- [ ] Testado o menu da bandeja
- [ ] Testado "Iniciar com o sistema"
- [ ] Testado minimizar/maximizar
- [ ] Testado fechar a janela (deve continuar na bandeja)
- [ ] Testado "Sair" do menu da bandeja

### macOS
- [ ] Arquivo `.zip` extraído e testado
- [ ] App arrastado para `/Applications`
- [ ] Testado primeira execução (pode pedir autorização de segurança)
- [ ] Testado permissões de acessibilidade (se necessário)

### Windows
- [ ] Instalador `.exe` executado
- [ ] Testado instalação completa
- [ ] Verificado atalho no Menu Iniciar
- [ ] Testado desinstalação

## 🚨 Avisos Importantes

### API Key do Groq
O app precisa da chave API do Groq para funcionar. Há duas opções:

**Opção 1: Variável de Ambiente (Recomendado)**
```bash
# Usuário deve configurar antes de executar
export GROQ_API_KEY="sua_chave"
```

**Opção 2: Hardcoded (Não Recomendado para Distribuição Pública)**
```typescript
// Em src/App.tsx, linha ~88
const result = await streamText({
  model: groq('llama-3.3-70b-versatile'),
  apiKey: process.env.GROQ_API_KEY || 'SUA_CHAVE_AQUI', // ⚠️ Cuidado!
  // ...
});
```

### Certificados SSL
O app desabilita verificação SSL para o domínio `diogrande.campogrande.ms.gov.br` devido a problemas com o certificado. Isso é necessário para a funcionalidade de Diários Oficiais.

### Permissões

**macOS:**
- Primeira execução pode pedir autorização em "Segurança e Privacidade"
- Pode ser necessário dar permissão de Acessibilidade para atalhos globais

**Windows:**
- Windows Defender pode alertar (normal para apps não assinados)
- Pode ser necessário "Executar mesmo assim" na primeira vez

## 📝 Notas de Desenvolvimento

### Estrutura do Projeto
```
src/
├── main.ts           # Processo principal (Electron)
├── preload.ts        # Script de preload (IPC bridge)
├── App.tsx           # Interface React
├── renderer.tsx      # Entry point React
├── index.css         # Estilos globais
└── tools/
    └── diogrande-tools.ts  # Ferramentas de AI SDK

public/
├── logo.png          # Logo original
├── logo.icns         # Ícone macOS
└── logo.ico          # Ícone Windows
```

### Tecnologias
- **Electron 38.3.0** - Framework desktop
- **React 19.2.0** - Interface
- **Vite 5.4.21** - Build tool
- **AI SDK 5.0.76** - Integração com Groq
- **Electron Forge 7.10.2** - Empacotamento e distribuição

### Dependências Importantes
- `electron-squirrel-startup` - Gerenciamento de instalação Windows
- `pdf-parse-new` - Parsing de PDFs (Diários Oficiais)
- `react-markdown` - Renderização de markdown
- `cheerio` - Parsing de HTML

## 🐛 Troubleshooting

### "App não inicia"
- Verifique se `GROQ_API_KEY` está configurada
- Verifique logs do console do sistema

### "Atalho global não funciona"
- Outro app pode estar usando o mesmo atalho
- O app tenta atalhos alternativos automaticamente
- Verifique no menu da bandeja qual atalho está ativo

### "Ícone não aparece na bandeja"
- Reinicie o app
- Em macOS: verifique se há espaço na barra de menu
- Em Windows: verifique configurações de ícones ocultos

### "Build falha"
- Limpe o cache: `rm -rf node_modules out .vite && npm install`
- Verifique se Node.js está atualizado (16+)
- Para Windows: use o Windows nativo ou WSL2

## 📞 Suporte

Para problemas ou dúvidas:
1. Verifique os logs em:
   - macOS: `~/Library/Logs/AgentSesau/`
   - Windows: `%APPDATA%\AgentSesau\logs\`
2. Abra o DevTools: `Command+Option+I` (Mac) ou `Ctrl+Shift+I` (Win)
3. Consulte `BUILD_INSTRUCTIONS.md` para detalhes técnicos

## 🎉 Próximos Passos

Para distribuição profissional, considere:
- [ ] Assinar o código (Code Signing)
  - macOS: Apple Developer Account + certificado
  - Windows: Certificado de code signing
- [ ] Notarização (macOS)
- [ ] Auto-update (electron-updater)
- [ ] Analytics/crash reporting
- [ ] Distribuição via:
  - Mac App Store
  - Microsoft Store
  - Homebrew Cask
  - Chocolatey
