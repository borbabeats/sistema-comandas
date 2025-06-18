# Sistema de Comandas - Backend

Backend API for the Sistema de Comandas application built with Node.js, TypeScript, Express, and TypeORM.

## Prerequisites

- Node.js (v14 or later)
- npm (v6 or later) or yarn
- PostgreSQL database

## Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd sistema-comandas/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   - Copy `.env.example` to `.env`
   - Update the database connection details in `.env`

4. **Database Setup**
   - Make sure PostgreSQL is running
   - Create a database matching your `.env` configuration

## Running the Application

### Development Mode
```bash
npm run dev
```

### Production Build
```bash
# Build the application
npm run build

# Start the server
npm start
```

### Database Seeding

Para popular o banco de dados com dados iniciais (bebidas, sobremesas e pratos), execute:

```bash
npm run seed
```

Este comando irá:
1. Conectar-se ao banco de dados PostgreSQL
2. Limpar as tabelas `beverages`, `desserts` e `plates`
3. Popular as tabelas com os dados dos arquivos JSON na raiz do projeto
4. Mostrar mensagens de log durante o processo

Certifique-se de que os seguintes arquivos estejam presentes na raiz do projeto:
- `beverages.json`
- `desserts.json`
- `plates.json`

**Nota:** Este comando irá apagar todos os dados existentes nas tabelas antes de inserir os dados de seed.

## Project Structure

```
backend/
├── src/
│   ├── config/         # Configuration files
│   ├── controllers/     # Route controllers
│   ├── entities/        # TypeORM entities
│   ├── middlewares/     # Custom express middlewares
│   ├── routes/          # Routes
│   ├── services/        # Business logic
│   ├── utils/           # Utility classes and functions
│   └── server.ts        # Application entry point
├── .env                 # Environment variables
├── package.json
└── tsconfig.json        # TypeScript configuration
```

## API Documentation

API documentation will be available at `http://localhost:3000/api-docs` when running in development mode.

## License

This project is licensed under the MIT License.
