import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { IsString, IsNotEmpty, IsBoolean, IsDefined, ValidateIf, IsOptional, IsUUID } from 'class-validator';
import { Plate } from './Plate';
import { Beverage } from './Beverage';
import { Dessert } from './Dessert';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 100 })
  @IsString()
  @IsNotEmpty({ message: 'O nome do cliente é obrigatório' })
  clientName!: string;

  @ManyToOne(() => Plate, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'plate_id' })
  @ValidateIf(o => !o.beverageId && !o.dessertId)
  @IsDefined({ message: 'Pelo menos um item (prato, bebida ou sobremesa) deve ser selecionado' })
  plate?: Plate | null;

  @Column({ name: 'plate_id', type: 'uuid', nullable: true })
  @IsUUID()
  @IsOptional()
  plateId?: string | null;

  @ManyToOne(() => Beverage, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'beverage_id' })
  @ValidateIf(o => !o.plateId && !o.dessertId)
  @IsDefined({ message: 'Pelo menos um item (prato, bebida ou sobremesa) deve ser selecionado' })
  beverage?: Beverage | null;

  @Column({ name: 'beverage_id', type: 'uuid', nullable: true })
  @IsUUID()
  @IsOptional()
  beverageId?: string | null;

  @ManyToOne(() => Dessert, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'dessert_id' })
  @ValidateIf(o => !o.plateId && !o.beverageId)
  @IsDefined({ message: 'Pelo menos um item (prato, bebida ou sobremesa) deve ser selecionado' })
  dessert?: Dessert | null;

  @Column({ name: 'dessert_id', type: 'uuid', nullable: true })
  @IsUUID()
  @IsOptional()
  dessertId?: string | null;

  @Column({ type: 'boolean', default: false })
  @IsBoolean()
  isPaid: boolean = false;

  @Column({ 
    type: 'varchar', 
    default: 'pending'
  })
  status: 'pending' | 'preparing' | 'ready' | 'delivered' = 'pending';

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  created_at!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updated_at!: Date;

  @Column({ type: 'text', nullable: true })
  @IsString()
  @IsOptional()
  observations: string | null = null;

  // Método para calcular o total do pedido
  calculateTotal(): number {
    let total = 0;
    if (this.plate) total += this.plate.price;
    if (this.beverage) total += this.beverage.price;
    if (this.dessert) total += this.dessert.price;
    return total;
  }
}
