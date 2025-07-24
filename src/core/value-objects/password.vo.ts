import { InvalidValueObjectException } from '../exceptions/domain-exceptions';

const MIN_PASSWORD_LENGTH = 8;

export class Password {
  private readonly value: string;

  constructor(password: string) {
    if (!this.isValid(password)) {
      throw new InvalidValueObjectException(
        `Password must be at least ${MIN_PASSWORD_LENGTH} characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character`,
      );
    }
    this.value = password;
  }

  private isValid(password: string): boolean {
    // The Password must be at least 8 characters long and include at least one uppercase letter,
    // one lowercase letter, one number, and one special character
    const passwordRegex = new RegExp(
      `^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*(),.?":{}|<>_])[A-Za-z\\d!@#$%^&*(),.?":{}|<>_]{${MIN_PASSWORD_LENGTH},}$`,
    );

    return passwordRegex.test(password);
  }

  getValue(): string {
    return this.value;
  }
}
