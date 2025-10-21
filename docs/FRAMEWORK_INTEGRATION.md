# 🎨 Integração com Frameworks Frontend

Guia completo para integrar frameworks modernos com seu projeto Electron + Vite.

## 🎯 Frameworks Suportados

- ⚛️ React
- 💚 Vue 3
- 🔶 Svelte
- ⚡ Solid.js
- 🅰️ Angular

---

## ⚛️ React

### Instalação

```bash
npm install react react-dom
npm install --save-dev @types/react @types/react-dom @vitejs/plugin-react
```

### Configuração do Vite

Atualize `vite.renderer.config.ts`:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
});
```

### Estrutura de Arquivos

```
src/
├── main.ts
├── preload.ts
├── renderer.tsx          # Renomeie de .ts para .tsx
├── App.tsx               # Novo
├── components/           # Novo
│   └── Counter.tsx
└── index.css
```

### App.tsx

```tsx
import { useState } from 'react';
import './index.css';

export function App() {
  const [count, setCount] = useState(0);
  const [version, setVersion] = useState<string>('');

  const loadVersion = async () => {
    if (window.electronAPI?.getAppVersion) {
      const v = await window.electronAPI.getAppVersion();
      setVersion(v);
    }
  };

  return (
    <div className="app">
      <h1>⚛️ React + Electron</h1>
      
      <div className="card">
        <button onClick={() => setCount(count + 1)}>
          Count is {count}
        </button>
      </div>

      <div className="card">
        <button onClick={loadVersion}>
          Get App Version
        </button>
        {version && <p>Version: {version}</p>}
      </div>
    </div>
  );
}
```

### renderer.tsx

```tsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './index.css';

const root = createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

### index.html

```html
<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>React + Electron</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/renderer.tsx"></script>
  </body>
</html>
```

---

## 💚 Vue 3

### Instalação

```bash
npm install vue
npm install --save-dev @vitejs/plugin-vue
```

### Configuração do Vite

Atualize `vite.renderer.config.ts`:

```typescript
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
});
```

### Estrutura de Arquivos

```
src/
├── main.ts
├── preload.ts
├── renderer.ts
├── App.vue               # Novo
├── components/           # Novo
│   └── Counter.vue
└── index.css
```

### App.vue

```vue
<template>
  <div class="app">
    <h1>💚 Vue 3 + Electron</h1>
    
    <div class="card">
      <button @click="count++">
        Count is {{ count }}
      </button>
    </div>

    <div class="card">
      <button @click="loadVersion">
        Get App Version
      </button>
      <p v-if="version">Version: {{ version }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const count = ref(0);
const version = ref('');

const loadVersion = async () => {
  if (window.electronAPI?.getAppVersion) {
    version.value = await window.electronAPI.getAppVersion();
  }
};
</script>

<style scoped>
.app {
  text-align: center;
  padding: 2rem;
}

.card {
  padding: 1rem;
  margin: 1rem 0;
}

button {
  padding: 0.5rem 1rem;
  font-size: 1rem;
  cursor: pointer;
}
</style>
```

### renderer.ts

```typescript
import { createApp } from 'vue';
import App from './App.vue';
import './index.css';

createApp(App).mount('#app');
```

### index.html

```html
<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vue 3 + Electron</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/renderer.ts"></script>
  </body>
</html>
```

---

## 🔶 Svelte

### Instalação

```bash
npm install svelte
npm install --save-dev @sveltejs/vite-plugin-svelte
```

### Configuração do Vite

Atualize `vite.renderer.config.ts`:

```typescript
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte()],
});
```

### svelte.config.js

Crie um arquivo na raiz:

```javascript
export default {
  // configurações opcionais
};
```

### Estrutura de Arquivos

```
src/
├── main.ts
├── preload.ts
├── renderer.ts
├── App.svelte            # Novo
├── components/           # Novo
│   └── Counter.svelte
└── index.css
```

### App.svelte

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  
  let count = 0;
  let version = '';

  async function loadVersion() {
    if (window.electronAPI?.getAppVersion) {
      version = await window.electronAPI.getAppVersion();
    }
  }

  onMount(() => {
    console.log('🔶 Svelte app mounted!');
  });
</script>

<div class="app">
  <h1>🔶 Svelte + Electron</h1>
  
  <div class="card">
    <button on:click={() => count++}>
      Count is {count}
    </button>
  </div>

  <div class="card">
    <button on:click={loadVersion}>
      Get App Version
    </button>
    {#if version}
      <p>Version: {version}</p>
    {/if}
  </div>
</div>

<style>
  .app {
    text-align: center;
    padding: 2rem;
  }

  .card {
    padding: 1rem;
    margin: 1rem 0;
  }

  button {
    padding: 0.5rem 1rem;
    font-size: 1rem;
    cursor: pointer;
    border-radius: 4px;
  }
</style>
```

### renderer.ts

```typescript
import App from './App.svelte';
import './index.css';

const app = new App({
  target: document.getElementById('app')!,
});

export default app;
```

### index.html

```html
<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Svelte + Electron</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/renderer.ts"></script>
  </body>
</html>
```

---

## ⚡ Solid.js

### Instalação

```bash
npm install solid-js
npm install --save-dev vite-plugin-solid
```

### Configuração do Vite

Atualize `vite.renderer.config.ts`:

```typescript
import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';

export default defineConfig({
  plugins: [solid()],
});
```

### App.tsx

```tsx
import { createSignal } from 'solid-js';
import './index.css';

export function App() {
  const [count, setCount] = createSignal(0);
  const [version, setVersion] = createSignal('');

  const loadVersion = async () => {
    if (window.electronAPI?.getAppVersion) {
      const v = await window.electronAPI.getAppVersion();
      setVersion(v);
    }
  };

  return (
    <div class="app">
      <h1>⚡ Solid.js + Electron</h1>
      
      <div class="card">
        <button onClick={() => setCount(count() + 1)}>
          Count is {count()}
        </button>
      </div>

      <div class="card">
        <button onClick={loadVersion}>
          Get App Version
        </button>
        {version() && <p>Version: {version()}</p>}
      </div>
    </div>
  );
}
```

### renderer.tsx

```tsx
import { render } from 'solid-js/web';
import { App } from './App';
import './index.css';

render(() => <App />, document.getElementById('root')!);
```

---

## 🎨 Tailwind CSS

Compatível com todos os frameworks acima!

### Instalação

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### tailwind.config.js

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx,vue,svelte}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

### src/index.css

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Seus estilos customizados */
```

### Exemplo com React + Tailwind

```tsx
export function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md">
        <h1 className="text-4xl font-bold text-gray-800 mb-6">
          ⚛️ React + Electron
        </h1>
        
        <div className="space-y-4">
          <button
            onClick={() => setCount(count + 1)}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Count is {count}
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

## 📦 Bibliotecas UI Populares

### Shadcn UI (React)
```bash
npx shadcn@latest init
```

### Vuetify (Vue)
```bash
npm install vuetify
```

### Material UI (React)
```bash
npm install @mui/material @emotion/react @emotion/styled
```

### Ant Design (React)
```bash
npm install antd
```

### DaisyUI (Tailwind)
```bash
npm install -D daisyui@latest
```

---

## 🚀 Dicas de Performance

### 1. Code Splitting
```typescript
// React
const LazyComponent = lazy(() => import('./components/Heavy'));

// Vue
const AsyncComponent = defineAsyncComponent(() => import('./components/Heavy.vue'));
```

### 2. Otimização do Build
```typescript
// vite.renderer.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom'], // ou vue, svelte, etc.
        }
      }
    }
  }
});
```

### 3. Tree Shaking
Importe apenas o que você precisa:
```typescript
// ❌ Não faça
import _ from 'lodash';

// ✅ Faça
import debounce from 'lodash/debounce';
```

---

## 🔧 Troubleshooting

### Problema: Hot Reload não funciona
**Solução**: Verifique se o plugin do framework está instalado e configurado no `vite.renderer.config.ts`

### Problema: Erros de TypeScript com componentes
**Solução**: Adicione os tipos necessários ao `tsconfig.json`:
```json
{
  "compilerOptions": {
    "jsx": "react-jsx", // ou "preserve" para Vue
    "types": ["vite/client"]
  }
}
```

### Problema: CSS não carrega
**Solução**: Importe o CSS no arquivo principal:
```typescript
import './index.css';
```

---

## 📚 Recursos Adicionais

- [Vite Plugin List](https://vitejs.dev/plugins/)
- [React Docs](https://react.dev/)
- [Vue 3 Docs](https://vuejs.org/)
- [Svelte Docs](https://svelte.dev/)
- [Solid.js Docs](https://solidjs.com/)
- [Tailwind CSS Docs](https://tailwindcss.com/)

---

**Escolha seu framework favorito e comece a construir! 🎉**
