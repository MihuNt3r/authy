import { InvalidValueObjectException } from '../exceptions/domain-exceptions';

const MAX_USERNAME_LENGTH = 50;

export class Username {
  private readonly value: string;

  constructor(username: string) {
    if (!this.isValid(username)) {
      throw new InvalidValueObjectException(
        `Username cannot be empty and cannot exceed ${MAX_USERNAME_LENGTH} characters.`,
      );
    }

    this.value = username;
  }

  private isValid(username: string): boolean {
    return (
      username.trim().length > 0 &&
      username.trim().length <= MAX_USERNAME_LENGTH
    );
  }

  getValue(): string {
    return this.value;
  }

  equals(username: Username): boolean {
    return this.value === username.getValue();
  }
}
