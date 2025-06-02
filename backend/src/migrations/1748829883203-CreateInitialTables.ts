import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateInitialTables1748829883203 implements MigrationInterface {
    name = 'CreateInitialTables1748829883203'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."plates_type_enum" AS ENUM('prato_principal', 'entrada', 'acompanhamento', 'salada', 'sopa', 'massas', 'carnes', 'peixes', 'vegetariano', 'vegano', 'outro')`);
        await queryRunner.query(`CREATE TABLE "plates" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "description" text NOT NULL, "price" numeric(10,2) NOT NULL, "info" text, "type" "public"."plates_type_enum" NOT NULL DEFAULT 'prato_principal', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_9a8950ff576a33188d5afcbdbe6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "desserts" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "description" text NOT NULL, "price" numeric(10,2) NOT NULL, "info" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_ab47f3ffbf86b1bc8c6a66fa27a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "beverages" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "description" text NOT NULL, "price" numeric(10,2) NOT NULL, "type" character varying(50) NOT NULL, "info" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_0bfd563a0b71116a22b63025c57" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "users" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "email" character varying NOT NULL, "password" character varying NOT NULL, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TABLE "beverages"`);
        await queryRunner.query(`DROP TABLE "desserts"`);
        await queryRunner.query(`DROP TABLE "plates"`);
        await queryRunner.query(`DROP TYPE "public"."plates_type_enum"`);
    }

}
