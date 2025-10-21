# 🎨 Correção: Textos Pretos e Logo Não Carrega no Windows

## 📋 Problemas Identificados

### 1. **Textos ficaram pretos no Windows**
**Causa:** O Windows 10/11 usa `prefers-color-scheme: light` por padrão em algumas configurações, fazendo o CSS aplicar as regras de light mode que estavam definidas no arquivo.

### 2. **Logo não carregou no input**
**Causa:** Caminhos absolutos como `/logo.png` não funcionam corretamente em builds Electron para Windows. O Vite precisa processar a imagem como um asset durante o build.

---

## ✅ Soluções Implementadas

### **1. Correção dos Textos Pretos**

#### Antes:
```css
@media (prefers-color-scheme: light) {
  :root {
    --color-text: #000000; /* ← Estava aplicando texto preto! */
  }
}
```

#### Depois:
- ✅ Removida a media query `prefers-color-scheme: light`
- ✅ Adicionado `!important` nas cores principais para forçar dark mode:

```css
body {
  color: var(--color-text) !important;
  background: transparent !important;
}

.search-input {
  color: #ffffff !important;
  background: transparent !important;
}

.message-bubble.user {
  background: linear-gradient(135deg, rgb(59, 130, 246), rgb(99, 102, 241)) !important;
  color: #ffffff !important;
}

.message-bubble.assistant {
  background: rgb(39, 39, 42) !important;
  color: #ffffff !important;
}
```

---

### **2. Correção da Logo**

#### Antes (não funcionava):
```tsx
// ❌ Caminho absoluto - não funciona em builds Electron
<img src="/logo.png" alt="Logo" />
```

#### Depois (funciona):
```tsx
// ✅ Import como asset do Vite
import logoImage from './assets/logo.png';

<img src={logoImage} alt="Logo" />
```

**Por que funciona agora:**
1. A logo foi copiada para `src/assets/logo.png`
2. O Vite processa a imagem durante o build
3. Gera um caminho correto para o executável Windows
4. A imagem é empacotada no bundle final

---

### **3. Configuração do Vite**

Atualizado `vite.renderer.config.mts`:

```typescript
export default defineConfig({
  plugins: [react()],
  base: './', // ← Importante: usa caminhos relativos
  publicDir: 'public', // ← Copia arquivos do public/
  build: {
    assetsDir: 'assets', // ← Organiza assets no build
  },
});
```

---

## 🧪 Como Testar

### 1. Limpar builds anteriores:
```bash
rm -rf out/ .vite/
```

### 2. Fazer novo build:
```bash
npm run make:win:x64
```

### 3. Verificar no Windows:
- ✅ Textos devem estar **brancos** (não pretos)
- ✅ Logo deve aparecer no input
- ✅ Todas as cores devem estar corretas
- ✅ Placeholder deve estar visível

---

## 🎨 Cores do Tema (Referência)

```css
:root {
  --color-bg: rgb(24, 24, 27);           /* Fundo escuro */
  --color-surface: rgb(39, 39, 42);      /* Superfície escura */
  --color-text: #ffffff;                  /* Texto branco */
  --color-text-muted: rgba(255, 255, 255, 0.7); /* Texto esmaecido */
  --color-accent: #3b82f6;               /* Azul de destaque */
}
```

**User message:** Azul gradient (`rgb(59, 130, 246)` → `rgb(99, 102, 241)`)
**Assistant message:** Cinza escuro (`rgb(39, 39, 42)`)
**Input background:** Cinza escuro (`rgb(39, 39, 42)`)

---

## 🔍 Estrutura de Assets

```
AgentSesau/
├── public/
│   ├── logo.png      ← Logo para ícone do app
│   ├── logo.ico      ← Ícone Windows
│   └── logo.icns     ← Ícone macOS
├── src/
│   ├── assets/
│   │   └── logo.png  ← Logo importada no código (NOVO)
│   ├── App.tsx
│   └── index.css
```

**Quando usar cada uma:**
- `public/logo.{ico,icns}` → Ícones do aplicativo (taskbar, janela)
- `src/assets/logo.png` → Logo dentro da UI (importada no código)

---

## 🐛 Troubleshooting

### **Textos ainda aparecem pretos**

1. **Verifique se o build foi refeito:**
   ```bash
   rm -rf out/ .vite/
   npm run make:win:x64
   ```

2. **Confirme que está usando o novo executável:**
   - Desinstale versões antigas do app
   - Instale o novo `AgentSesau-Setup.exe`

3. **Verifique o DevTools no Windows:**
   - Pressione `Ctrl+Shift+I` no app
   - Vá em **Elements** → Inspect um texto
   - Verifique se `color: #ffffff !important` está aplicado
   - Se não estiver, o CSS pode não ter sido incluído no build

---

### **Logo não aparece**

1. **Verifique se a logo foi copiada:**
   ```bash
   ls -la /Users/sesau/Documents/AgentSesau/src/assets/logo.png
   ```

2. **Verifique o console no DevTools:**
   - Pressione `Ctrl+Shift+I`
   - Vá em **Console**
   - Procure por erros de "Failed to load image" ou similar

3. **Fallback para emoji:**
   - Se a logo não carregar, um fallback automático para 🤖 foi implementado
   - Se ver o emoji, significa que o caminho da imagem está incorreto

---

### **Verificar no DevTools se o import funcionou:**

```javascript
// No Console do DevTools:
document.querySelector('.search-icon-image').src
// Deve retornar algo como: "file:///C:/Users/.../assets/logo-abc123.png"
```

Se retornar `null` ou erro, a imagem não foi importada corretamente.

---

## 📝 Checklist de Verificação

Antes de distribuir o build Windows:

- [ ] Limpar builds anteriores (`rm -rf out/ .vite/`)
- [ ] Fazer novo build (`npm run make:win:x64`)
- [ ] Testar no Windows 10/11
- [ ] **Verificar textos brancos** (não pretos)
- [ ] **Verificar logo aparece** no input
- [ ] Verificar placeholder visível
- [ ] Verificar cores das mensagens (azul user, cinza assistant)
- [ ] Verificar ícone do app na taskbar
- [ ] Testar tema em diferentes configurações do Windows

---

## 🎯 Resumo das Mudanças

| Arquivo | Mudança | Por quê |
|---------|---------|---------|
| `src/index.css` | Removido `@media (prefers-color-scheme: light)` | Evita textos pretos no Windows |
| `src/index.css` | Adicionado `!important` nas cores | Força dark mode sempre |
| `src/App.tsx` | Import de `./assets/logo.png` | Caminho correto para Electron |
| `src/assets/logo.png` | Novo arquivo | Logo processada pelo Vite |
| `vite.renderer.config.mts` | `base: './'` | Caminhos relativos para Electron |

---

## ✅ Status

**Problema:** Textos pretos e logo não carrega no Windows ❌
**Solução:** Implementada ✅
**Próximo passo:** Fazer novo build e testar no Windows

```bash
rm -rf out/ .vite/
npm run make:win:x64
```

**Testado em:**
- [ ] Windows 10 x64
- [ ] Windows 11 x64
- [ ] Windows 10 ia32 (se aplicável)

---

## 📚 Referências

- [Vite - Static Asset Handling](https://vitejs.dev/guide/assets.html)
- [Electron - Application Distribution](https://www.electronjs.org/docs/latest/tutorial/application-distribution)
- [CSS !important](https://developer.mozilla.org/en-US/docs/Web/CSS/Specificity#the_!important_exception)
