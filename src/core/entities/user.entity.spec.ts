import { User } from './user.entity';
import { Email } from '../value-objects/email.vo';
import { Username } from '../value-objects/username.vo';
import { Name } from '../value-objects/name.vo';
import { UserId } from '../value-objects/user-id.vo';

describe('User Entity', () => {
  it('should create a new user with valid data', () => {
    const email = new Email('test@example.com');
    const username = new Username('testuser');
    const name = new Name('Test User');
    const passwordHash = 'hashed_password';

    const user = User.create(email, passwordHash, username, name);

    expect(user).toBeInstanceOf(User);
    expect(user.email.getValue()).toBe('test@example.com');
    expect(user.username.getValue()).toBe('testuser');
    expect(user.name.getValue()).toBe('Test User');
    expect(user.passwordHash).toBe(passwordHash);
    expect(user.id).toBeInstanceOf(UserId);
  });

  it('should generate a new UserId on creation', () => {
    const email = new Email('test@example.com');
    const username = new Username('testuser');
    const name = new Name('Test User');
    const passwordHash = 'hashed_password';

    const user1 = User.create(email, passwordHash, username, name);
    const user2 = User.create(email, passwordHash, username, name);

    expect(user1.id.getValue()).not.toBe(user2.id.getValue());
  });
});
