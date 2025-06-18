import { IsString, IsOptional, IsBoolean, IsUUID, IsNotEmpty } from 'class-validator';

export class CreateOrderDto {
  @IsString()
  @IsNotEmpty({ message: 'O nome do cliente é obrigatório' })
  clientName!: string;

  @IsUUID()
  @IsOptional()
  plateId?: string;

  @IsUUID()
  @IsOptional()
  beverageId?: string;

  @IsUUID()
  @IsOptional()
  dessertId?: string;

  @IsBoolean()
  @IsOptional()
  isPaid: boolean = false;

  @IsString()
  @IsOptional()
  observations?: string;
}
