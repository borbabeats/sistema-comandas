import { IsString, IsOptional, IsBoolean, IsInt, Min, IsNotEmpty } from 'class-validator';

export class CreateOrderDto {
  @IsString()
  @IsNotEmpty({ message: 'O nome do cliente é obrigatório' })
  clientName!: string;

  @IsInt()
  @Min(1, { message: 'ID do prato inválido' })
  @IsOptional()
  plateId?: number;

  @IsInt()
  @Min(1, { message: 'ID da bebida inválido' })
  @IsOptional()
  beverageId?: number;

  @IsInt()
  @Min(1, { message: 'ID da sobremesa inválido' })
  @IsOptional()
  dessertId?: number;

  @IsBoolean()
  @IsOptional()
  isPaid: boolean = false;
}
