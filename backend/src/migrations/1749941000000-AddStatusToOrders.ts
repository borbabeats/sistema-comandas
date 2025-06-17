import { MigrationInterface, QueryRunner } from "typeorm";

export class AddStatusToOrders1749941000000 implements MigrationInterface {
    name = 'AddStatusToOrders1749941000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "orders" 
            ADD COLUMN "status" VARCHAR(20) NOT NULL DEFAULT 'pending'
            CONSTRAINT "CHK_order_status" 
            CHECK ("status" IN ('pending', 'preparing', 'ready', 'delivered'))
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "status"`);
    }
}
