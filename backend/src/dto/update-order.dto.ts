import { IsString, IsOptional, IsBoolean, IsInt, Min } from 'class-validator';

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
}
