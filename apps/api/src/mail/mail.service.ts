import { Injectable, Logger } from '@nestjs/common';
import { IMailService } from './mail.interface';

@Injectable()
export class MailService implements IMailService {
  private readonly logger = new Logger(MailService.name);

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    this.logger.log(
      `[DEV MAIL DRIVER] Password reset requested for ${email}. Token: ${token} (Valid for 30 minutes)`,
    );
  }
}
