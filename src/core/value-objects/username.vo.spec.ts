import { Username } from './username.vo';
import { InvalidValueObjectException } from '../exceptions/domain-exceptions';

describe('Name Value Object', () => {
  it('should create a valid name', () => {
    // Arrange & Act
    const name = new Username('John1337');

    // Assert
    expect(name).toBeDefined();
    expect(name.getValue()).toBe('John1337');
  });

  it('should throw for empty name', () => {
    // Arrange & Act & Assert
    expect(() => new Username('')).toThrow(InvalidValueObjectException);
  });

  it('should throw for too long name', () => {
    // Arrange & Act & Assert
    expect(
      () =>
        new Username(
          '123456789012345678901234567890123456789012345678901234567890',
        ),
    ).toThrow(InvalidValueObjectException);
  });
});
