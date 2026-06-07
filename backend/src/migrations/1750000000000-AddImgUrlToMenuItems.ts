import { MigrationInterface, QueryRunner } from "typeorm";

export class AddImgUrlToMenuItems1750000000000 implements MigrationInterface {
    name = 'AddImgUrlToMenuItems1750000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Verifica se a tabela beverages existe antes de adicionar a coluna
        const beverageTableExists = await queryRunner.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_name = 'beverages'
        `);
        
        if (beverageTableExists.length > 0) {
            const beverageColumn = await queryRunner.query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'beverages' 
                AND column_name = 'imgurl'
            `);
            
            if (beverageColumn.length === 0) {
                await queryRunner.query(`
                    ALTER TABLE "beverages" 
                    ADD COLUMN "imgurl" TEXT
                `);
                console.log('✅ Coluna imgurl adicionada em beverages');
            }
        }
        
        // Verifica se a tabela desserts existe antes de adicionar a coluna
        const dessertTableExists = await queryRunner.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_name = 'desserts'
        `);
        
        if (dessertTableExists.length > 0) {
            const dessertColumn = await queryRunner.query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'desserts' 
                AND column_name = 'imgurl'
            `);
            
            if (dessertColumn.length === 0) {
                await queryRunner.query(`
                    ALTER TABLE "desserts" 
                    ADD COLUMN "imgurl" TEXT
                `);
                console.log('✅ Coluna imgurl adicionada em desserts');
            }
        }
        
        // Verifica se a tabela plates existe antes de adicionar a coluna
        const plateTableExists = await queryRunner.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_name = 'plates'
        `);
        
        if (plateTableExists.length > 0) {
            const plateColumn = await queryRunner.query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'plates' 
                AND column_name = 'imgurl'
            `);
            
            if (plateColumn.length === 0) {
                await queryRunner.query(`
                    ALTER TABLE "plates" 
                    ADD COLUMN "imgurl" TEXT
                `);
                console.log('✅ Coluna imgurl adicionada em plates');
            }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "beverages" DROP COLUMN IF EXISTS "imgurl"`);
        await queryRunner.query(`ALTER TABLE "desserts" DROP COLUMN IF EXISTS "imgurl"`);
        await queryRunner.query(`ALTER TABLE "plates" DROP COLUMN IF EXISTS "imgurl"`);
    }
}
