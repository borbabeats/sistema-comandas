import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { IsString, IsNotEmpty, IsBoolean, IsDefined, ValidateIf, IsOptional } from 'class-validator';
import { Plate } from './Plate';
import { Beverage } from './Beverage';
import { Dessert } from './Dessert';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 50 })
  @IsString()
  @IsNotEmpty({ message: 'O nome do cliente é obrigatório' })
  clientName!: string;

  @ManyToOne(() => Plate, { nullable: true })
  @JoinColumn({ name: 'plateId' })
  @ValidateIf(o => !o.beverageId && !o.dessertId)
  @IsDefined({ message: 'Pelo menos um item (prato, bebida ou sobremesa) deve ser selecionado' })
  plate?: Plate | null;

  @Column({ nullable: true })
  plateId?: number;

  @ManyToOne(() => Beverage, { nullable: true })
  @JoinColumn({ name: 'beverageId' })
  @ValidateIf(o => !o.plateId && !o.dessertId)
  @IsDefined({ message: 'Pelo menos um item (prato, bebida ou sobremesa) deve ser selecionado' })
  beverage?: Beverage | null;

  @Column({ nullable: true })
  beverageId?: number;

  @ManyToOne(() => Dessert, { nullable: true })
  @JoinColumn({ name: 'dessertId' })
  @ValidateIf(o => !o.plateId && !o.beverageId)
  @IsDefined({ message: 'Pelo menos um item (prato, bebida ou sobremesa) deve ser selecionado' })
  dessert?: Dessert | null;

  @Column({ nullable: true })
  dessertId?: number;

  @Column({ type: 'boolean', default: false })
  @IsBoolean()
  isPaid: boolean = false;

  @Column({ 
    type: 'enum', 
    enum: ['pending', 'preparing', 'ready', 'delivered'],
    default: 'pending' 
  })
  status: 'pending' | 'preparing' | 'ready' | 'delivered' = 'pending';

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date = new Date();

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date = new Date();

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
