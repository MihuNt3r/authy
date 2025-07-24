import { Email } from '../value-objects/email.vo';
import { Name } from '../value-objects/name.vo';
import { Username } from '../value-objects/username.vo';
import { UserId } from '../value-objects/user-id.vo';

export class User {
  private readonly _id: UserId;
  private _email: Email;
  private _username: Username;
  private _name: Name;
  private _passwordHash: string;

  private constructor(
    id: UserId,
    email: Email,
    passwordHash: string,
    username: Username,
    name: Name,
  ) {
    this._id = id;
    this._email = email;
    this._passwordHash = passwordHash;
    this._username = username;
    this._name = name;
  }

  // Factory method for creating new users
  static create(
    email: Email,
    passwordHash: string,
    username: Username,
    name: Name,
  ): User {
    const userId = UserId.create();

    const user = new User(userId, email, passwordHash, username, name);

    return user;
  }

  // Getters
  get id(): UserId {
    return this._id;
  }

  get email(): Email {
    return this._email;
  }

  get passwordHash(): string {
    return this._passwordHash;
  }

  get username(): Username {
    return this._username;
  }

  get name(): Name {
    return this._name;
  }
}
