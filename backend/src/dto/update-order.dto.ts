import { IsString, IsOptional, IsBoolean, IsUUID } from 'class-validator';

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
  @IsOptional()
  info?: string;
}
