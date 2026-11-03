import { IsNotEmpty, IsString, IsUUID, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TransferMoneyInputDto {
  @ApiProperty({ example: 'acde070d-8c4c-4f0d-9d8a-162843c10333' })
  @IsUUID()
  recipientId: string;

  @ApiProperty({
    example: '100.50',
    type: String,
    description: 'Positive USD amount, maximum 2 decimal places',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^(?=0*[1-9]|0*\d+\.\d*[1-9])\d{1,13}(?:\.\d{1,2})?$/, {
    message: 'Amount must be positive with up to 2 decimal places',
  })
  amount: string;
}
