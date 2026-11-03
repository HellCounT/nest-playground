import { ApiProperty } from '@nestjs/swagger';

export class AccessTokenOutputDto {
  @ApiProperty({
    description: 'JWT access token',
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMDAiLCJzZXNzaW9uSWQiOiJhM2Y1YjI1MS00ZDAzLTQ2YjEtOGUwZS1jM2M0YzU2NzhlOTAiLCJpYXQiOjE3ODk0NzAwMDAsImV4cCI6MTc4OTQ3MDkwMH0.example-signature',
  })
  accessToken: string;
}
