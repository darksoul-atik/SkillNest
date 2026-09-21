export interface IMailService {
  sendPasswordResetEmail(email: string, token: string): Promise<void>;
}
