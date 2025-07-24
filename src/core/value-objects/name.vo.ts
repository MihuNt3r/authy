import { InvalidValueObjectException } from '../exceptions/domain-exceptions';

const MAX_NAME_LENGTH = 50;

export class Name {
  private readonly value: string;

  constructor(name: string) {
    if (!this.isValid(name)) {
      throw new InvalidValueObjectException('Invalid name format');
    }
    this.value = this.formatName(name);
  }

  private isValid(name: string): boolean {
    return name.trim().length > 0 && name.trim().length <= MAX_NAME_LENGTH;
  }

  private formatName(name: string): string {
    return name.trim();
  }

  getValue(): string {
    return this.value;
  }

  equals(name: Name): boolean {
    return this.value === name.getValue();
  }
}
