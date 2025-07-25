2. I think if our service needs to handle 1000 or 100000 requests per seconds we need to perform Horizontal scaling.\
First of all we implemented caching, it reduces load on the database.\
Then we can run multiple instances of our service with Docker. Also, Kubernetes can manage auto scaling.\
Also, we need to use some monitoring applications. We can use Graphana and Prometheus. \
Also, if we have one database it can become bottleneck of our application.\
To handle database bottleneck we can use sharding to split our data by some criteria. For example by username in alphabetical order. In this case we can scale our database horizontally.\
If some parts of our code appear to be bottlenecks we can rewrite that part in Rust and use WASM to embed it in Node.js. In this case we are using fast compiled language to handle some tasks.
3. To handle registration and login with Social Media we can use OAuth 2.0 / OpenID Connect libraries.\
We can use @nestjs/passport library for that.\


