## Scaling for handling 1000 or 100000 requests

I think if our service needs to handle 1000 or 100000 requests per seconds we need to perform Horizontal scaling.\
First of all we implemented caching, it reduces load on the database.\
Then we can run multiple instances of our service with Docker. Also, Kubernetes can manage auto scaling.\
Also, we need to use some monitoring applications. We can use Graphana and Prometheus. \
Also, if we have one database it can become bottleneck of our application.\
To handle database bottleneck we can use sharding to split our data by some criteria. For example by username in alphabetical order. In this case we can scale our database horizontally.\
If some parts of our code appear to be bottlenecks we can rewrite that part in Rust and use WASM to embed it in Node.js. In this case we are using fast compiled language to handle some tasks.

## Social Login

To handle registration and login with Social Media we can use OAuth 2.0 / OpenID Connect libraries.\
We can use @nestjs/passport library for that.\
For example we can create GithubStrategy for authenticating with Github
```
//auth.strategy.ts

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-github';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(configService: ConfigService) {
    super({
      clientID: configService.get<string>('GITHUB_CLIENT_ID'),
      clientSecret: configService.get<string>('GITHUB_CLIENT_SECRET'),
      callbackURL: '<http://localhost:8000/auth/callback>',
      scope: ['public_profile'],
    });
  }

  async validate(accessToken: string, _refreshToken: string, profile: Profile) {
    return profile;
  }
}
```

Then I will implement account linking scenarios\
For example if user registers with email/password as john@example.com and later tries to login with Google using same email john@example.com. We can automatically link or prompt user to confirm linking.
