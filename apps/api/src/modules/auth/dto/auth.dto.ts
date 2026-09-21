import { createZodDto } from 'nestjs-zod';
import {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateProfileSchema,
  oauthExchangeSchema,
} from '@skillnest/shared';

export class RegisterDto extends createZodDto(registerSchema) {}
export class LoginDto extends createZodDto(loginSchema) {}
export class ChangePasswordDto extends createZodDto(changePasswordSchema) {}
export class ForgotPasswordDto extends createZodDto(forgotPasswordSchema) {}
export class ResetPasswordDto extends createZodDto(resetPasswordSchema) {}
export class UpdateProfileDto extends createZodDto(updateProfileSchema) {}
export class OAuthExchangeDto extends createZodDto(oauthExchangeSchema) {}
