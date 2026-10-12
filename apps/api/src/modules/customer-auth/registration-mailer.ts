import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/** Transactional mail only. Never print links or provider responses. Tests override send(). */
@Injectable()
export class RegistrationMailer {
  private readonly apiKey: string;
  private readonly from: string;
  private readonly testing: boolean;
  constructor(config: ConfigService) {
    this.testing = config.get<string>('NODE_ENV') === 'test';
    this.apiKey =
      config.get<string>('REGISTRATION_EMAIL_API_KEY')?.trim() ?? '';
    this.from = config.get<string>('REGISTRATION_EMAIL_FROM')?.trim() ?? '';
    if (
      config.get<string>('NODE_ENV') === 'production' &&
      (!this.apiKey || !this.from)
    ) {
      throw new Error(
        'Production registration requires REGISTRATION_EMAIL_API_KEY and REGISTRATION_EMAIL_FROM.',
      );
    }
  }

  async send(email: string, link: string): Promise<void> {
    if (this.testing || !this.apiKey || !this.from)
      throw new Error('Registration delivery unavailable');
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      signal: AbortSignal.timeout(10_000),
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: this.from,
        to: [email],
        subject: 'Finish creating your Orderly account',
        text: `To create an Orderly account, open this link and choose your own password:\n\n${link}\n\nThis link expires in 30 minutes. Clicking it does not create an account. If you did not request this, ignore this email. Existing accounts cannot be changed with this link.`,
      }),
    });
    if (!response.ok) throw new Error('Registration delivery unavailable');
    await response.body?.cancel();
  }
}
