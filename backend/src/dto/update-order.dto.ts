import { IsString, IsOptional, IsBoolean, IsUUID, IsIn } from 'class-validator';

export class UpdateOrderDto {
  @IsString()
  @IsOptional()
  clientName?: string;

  @IsUUID()
  @IsOptional()
  plateId?: string | null;

  @IsUUID()
  @IsOptional()
  beverageId?: string | null;

  @IsUUID()
  @IsOptional()
  dessertId?: string | null;

  @IsBoolean()
  @IsOptional()
  isPaid?: boolean;
  
  @IsString()
  @IsIn(['pending', 'preparing', 'ready', 'delivered'], { 
    message: 'Status inválido. Os valores permitidos são: pending, preparing, ready, delivered' 
  })
  @IsOptional()
  status?: 'pending' | 'preparing' | 'ready' | 'delivered';
}
