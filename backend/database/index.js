const { DataSource } = require("typeorm");
const { Plate } = require("../src/entities/Plate");
const { Dessert } = require("../src/entities/Dessert");
const { Beverage } = require("../src/entities/Beverage");
const { User } = require("../src/entities/User");

const AppDataSource = new DataSource({
    type: "postgres",
    host: process.env.DB_HOST || "db",
    port: parseInt(process.env.DB_PORT || "5432"),
    username: process.env.DB_USER || "admin",
    password: process.env.DB_PASSWORD || "admin",
    database: process.env.DB_NAME || "comandas",
    entities: [Plate, Dessert, Beverage, User].filter(Boolean),
    migrations: ["src/migrations/*.ts"],
    synchronize: false,
    logging: process.env.NODE_ENV === "development",
    migrationsRun: false,
    migrationsTableName: "migrations"
});

module.exports = AppDataSource;