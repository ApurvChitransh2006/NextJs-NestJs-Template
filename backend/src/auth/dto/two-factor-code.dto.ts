import { IsString, Length } from 'class-validator';

export class TwoFactorCodeDto {
  @IsString()
  @Length(6, 9) // 6-digit TOTP code, or an 8-char "XXXX-XXXX" backup code
  code!: string;
}
