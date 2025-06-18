import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { IsString, IsNumber, IsOptional, IsIn } from 'class-validator';

export enum BeverageType {
  WINE = 'wine',
  BEER = 'beer',
  COCKTAIL = 'cocktail',
  SODA = 'soda',
  JUICE = 'juice',
  OTHER = 'other'
}

@Entity('beverages')
export class Beverage {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  @IsString()
  name!: string;

  @Column('text')
  @IsString()
  description!: string;

  @Column('decimal', { precision: 10, scale: 2 })
  @IsNumber()
  price!: number;

  @Column({ type: 'varchar', length: 50, default: 'other' })
  @IsIn(Object.values(BeverageType))
  type!: BeverageType;

  @Column({ type: 'text', nullable: true })
  @IsString()
  @IsOptional()
  info?: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  created_at!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updated_at!: Date;
}
