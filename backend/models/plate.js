"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const { EntitySchema } = require("typeorm");

const Plate = new EntitySchema({
    name: "Plate",
    columns: {
        id: {
            type: Number,
            primary: true,
            generated: true,
        },
        name: {
            type: String,
        },
        description: {
            type: String,
        },
        price: {
            type: "decimal",
            precision: 10,
            scale: 2,
        },
        info: {
            type: String,
        },
        type: {
            type: String,
        },
    },
});

const Dessert = new EntitySchema({
    name: "Dessert",
    columns: {
        id: {
            type: Number,
            primary: true,
            generated: true,
        },
        name: {
            type: String,
        },
        description: {
            type: String,
        },
        price: {
            type: "decimal",
            precision: 10,
            scale: 2,
        },
        info: {
            type: String,
        },
    },
});

const Beverage = new EntitySchema({
    name: "Beverage",
    columns: {
        id: {
            type: Number,
            primary: true,
            generated: true,
        },
        name: {
            type: String,
        },
        description: {
            type: String,
        },
        price: {
            type: "decimal",
            precision: 10,
            scale: 2,
        },
        info: {
            type: String,
        },
        type: {
            type: String,
        },
    },
});

module.exports = { Plate, Dessert, Beverage };