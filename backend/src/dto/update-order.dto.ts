import { IsString, IsOptional, IsBoolean, IsInt, Min, IsIn } from 'class-validator';

export class UpdateOrderDto {
  @IsString()
  @IsOptional()
  clientName?: string;

  @IsInt()
  @Min(1, { message: 'ID do prato inválido' })
  @IsOptional()
  plateId?: number | null;

  @IsInt()
  @Min(1, { message: 'ID da bebida inválido' })
  @IsOptional()
  beverageId?: number | null;

  @IsInt()
  @Min(1, { message: 'ID da sobremesa inválido' })
  @IsOptional()
  dessertId?: number | null;

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
