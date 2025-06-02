import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { IsString, IsNumber, IsOptional, IsIn, IsPositive } from 'class-validator';

export enum FoodType {
  SEAFOOD = 'seafood',
  RED_MEAT = 'red meat',
  WHITE_MEAT = 'white meat',
  VEGETARIAN = 'vegetarian',
  PASTA = 'pasta',
  SALAD = 'salad',
  SANDWICH = 'sandwich',
  OTHER = 'other'
}

@Entity('plates')
export class Plate {
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
  @IsPositive()
  price!: number;

  @Column({ type: 'text', nullable: true })
  @IsString()
  @IsOptional()
  info?: string;

  @Column({
    type: 'enum',
    enum: FoodType,
    default: FoodType.OTHER
  })
  @IsIn(Object.values(FoodType))
  type!: FoodType;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt!: Date;
}
