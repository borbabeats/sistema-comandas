import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { IsString, IsNumber, IsOptional, IsPositive } from 'class-validator';

@Entity('desserts')
export class Dessert {
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
  @IsPositive()
  price!: number;

  @Column({ type: 'text', nullable: true })
  @IsString()
  @IsOptional()
  info?: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  created_at!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updated_at!: Date;
}
