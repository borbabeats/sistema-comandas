import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { IsString, IsNumber, IsOptional, IsIn } from 'class-validator';

export enum BeverageType {
  WINE = 'wine',
  BEER = 'beer',
  COCKTAIL = 'cocktail',
  SODA = 'soda',
  JUICE = 'juice'
}

@Entity('beverages')
export class Beverage {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  @IsString()
  name!: string;

  @Column('text')
  @IsString()
  description!: string;

  @Column('decimal', { precision: 10, scale: 2 })
  @IsNumber()
  price!: number;

  @Column({ type: 'varchar', length: 50 })
  @IsIn(Object.values(BeverageType))
  type!: BeverageType;

  @Column({ type: 'text', nullable: true })
  @IsString()
  @IsOptional()
  info?: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt!: Date;
}
