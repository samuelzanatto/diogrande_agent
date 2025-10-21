# 🤖 Agent Sesau - AI Assistant

Um agente de IA moderno com interface flutuante, construído com **React**, **Electron**, **TypeScript** e **Vite**.

## ✨ Características

- 🎯 **Janela Flutuante** - Interface sempre no topo, sem bordas, com efeito glassmorphism
- ⌨️ **Atalho Global** - Acesso rápido com `Command+Shift+Space` (macOS) ou `Ctrl+Shift+Space` (Windows/Linux)
- 🎨 **Design Moderno** - Inspirado em Spotlight e Raycast com blur e transparência
- ⚡ **React + Vite** - Hot Module Replacement ultrarrápido
- 🔷 **TypeScript** - Tipagem completa para maior segurança
- 🔒 **IPC Seguro** - Comunicação entre processos com Context Isolation

## 🚀 Como Usar

### Instalação

```bash
npm install
```

### Desenvolvimento

```bash
npm start
```

### Atalhos de Teclado

- **`Command+Shift+Space`** (macOS) / **`Ctrl+Shift+Space`** (Windows/Linux) - Abrir/Fechar janela
- **`Escape`** - Fechar janela
- **`Enter`** - Enviar query para o agente

### Build para Produção

```bash
npm run package    # Criar versão de produção
npm run make       # Gerar instaladores
```

## 🏗️ Estrutura do Projeto

```
AgentSesau/
├── src/
│   ├── main.ts           # Processo principal (janela, atalhos, IPC)
│   ├── preload.ts        # Bridge segura entre main e renderer
│   ├── renderer.tsx      # Inicialização React
│   ├── App.tsx           # Componente principal do agente
│   ├── index.css         # Estilos com glassmorphism
│   ├── electron.d.ts     # Tipos TypeScript para API
│   └── vite-env.d.ts     # Tipos Vite
├── index.html            # HTML da aplicação
├── package.json          # Dependências
├── tsconfig.json         # Configuração TypeScript
└── forge.config.ts       # Configuração Electron Forge
```

## 🎨 Tecnologias

### Core
- **Electron 38.3.0** - Framework desktop
- **React 19.2.0** - Biblioteca UI
- **TypeScript 4.5.4** - Tipagem estática
- **Vite 5.4.21** - Build tool

### Ferramentas
- **@electron-forge** - Empacotamento e distribuição
- **@vitejs/plugin-react** - Fast Refresh para React

## 💡 Funcionalidades Planejadas

- [ ] Integração com APIs de IA (OpenAI, Anthropic, etc.)
- [ ] Histórico de conversas
- [ ] Comandos personalizados
- [ ] Plugins e extensões
- [ ] Temas customizáveis
- [ ] Resultados em tempo real
- [ ] Suporte multi-idioma

## 🔧 Configurações

### Modificar o Atalho Global

Edite `src/main.ts`:

```typescript
const shortcut = 'Command+Option+Space'; // Seu atalho preferido
```

### Ajustar Posição da Janela

Edite `src/main.ts`:

```typescript
const y = Math.floor(screenHeight * 0.3); // 0.3 = 30% do topo
```

### Alterar Dimensões

```typescript
const windowWidth = 700;  // Largura
const windowHeight = 80;  // Altura
```

## 🎯 Como Integrar com IA

1. Instale o SDK da sua API de IA preferida:
   ```bash
   npm install openai
   # ou
   npm install @anthropic-ai/sdk
   ```

2. Adicione sua chave de API em variáveis de ambiente

3. Implemente a lógica no `handleSubmit` do `App.tsx`

4. Exiba os resultados na interface

## 📝 Licença

MIT

---

**Desenvolvido com ❤️ usando React + Electron + Vite + TypeScript**
