import { Name } from './name.vo';
import { InvalidValueObjectException } from '../exceptions/domain-exceptions';

describe('Name Value Object', () => {
  it('should create a valid name', () => {
    // Arrange & Act
    const name = new Name('John');

    // Assert
    expect(name).toBeDefined();
    expect(name.getValue()).toBe('John');
  });

  it('should throw for empty name', () => {
    // Arrange & Act & Assert
    expect(() => new Name('')).toThrow(InvalidValueObjectException);
  });

  it('should throw for too long name', () => {
    // Arrange & Act & Assert
    expect(
      () =>
        new Name(
          '123456789012345678901234567890123456789012345678901234567890',
        ),
    ).toThrow(InvalidValueObjectException);
  });
});
