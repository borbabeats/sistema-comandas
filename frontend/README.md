# Sistema de Comandas - Frontend

Aplicativo web para gerenciamento de comandas, construído com React, TypeScript e Vite.

## 🚀 Tecnologias

- React 18
- TypeScript
- Vite
- Chakra UI
- React Query
- React Router
- Axios
- Zustand (gerenciamento de estado)

## 🛠️ Configuração do Ambiente

1. **Pré-requisitos**
   - Node.js 16+ e npm/yarn
   - VS Code (recomendado) com as extensões do `.vscode/extensions.json`

2. **Instalação**
   ```bash
   # Instalar dependências
   npm install
   
   # Iniciar servidor de desenvolvimento
   npm run dev
   ```

3. **Scripts Disponíveis**
   - `npm run dev` - Inicia o servidor de desenvolvimento
   - `npm run build` - Gera a build de produção
   - `npm run lint` - Executa o linter
   - `npm run preview` - Visualiza a build de produção localmente
   - `npm run type-check` - Verifica os tipos TypeScript

## 🎨 Estrutura do Projeto

```
src/
├── components/     # Componentes reutilizáveis
├── pages/          # Páginas da aplicação
├── hooks/          # Custom hooks
├── services/       # Chamadas à API
├── store/          # Gerenciamento de estado (Zustand)
├── types/          # Tipos TypeScript
├── utils/          # Utilitários
├── App.tsx         # Componente principal
└── main.tsx        # Ponto de entrada
```

## 📝 Licença

Este projeto está sob a licença MIT.
