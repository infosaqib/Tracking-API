<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="200" alt="Nest Logo" /></a>
</p>

<p align="center">WEB API FOR CONNEXUS</p>

## Description

Connexus internal tool apis

## Installation

```bash
$ yarn install
```

## Running the app 

```bash
# development
$ yarn run start

# watch mode
$ yarn run start:dev

# production mode
$ yarn run start:prod
```

## Test

```bash
# unit tests
$ yarn run test

# e2e tests
$ yarn run test:e2e

# test coverage
$ yarn run test:cov
```

## Tech Stack

- [NestJS](https://nestjs.com/) - A progressive Node.js framework for building efficient and scalable server-side applications
- [TypeScript](https://www.typescriptlang.org/) - A typed superset of JavaScript that compiles to plain JavaScript
- [Yarn](https://yarnpkg.com/) - Package manager
- [Jest](https://jestjs.io/) - Testing framework
- [Prisma](https://www.prisma.io/) - Next-generation ORM for Node.js and TypeScript
- [PostgreSQL](https://www.postgresql.org/) - Open-source relational database
- [AWS Services](https://aws.amazon.com/):
  - [Amazon Cognito](https://aws.amazon.com/cognito/) - User authentication and authorization
  - [Amazon SES (Simple Email Service)](https://aws.amazon.com/ses/) - Email sending service
- [Swagger](https://swagger.io/) - API documentation
- [Winston](https://github.com/winstonjs/winston) - Logging library
- [Husky](https://typicode.github.io/husky/) - Git hooks made easy
- [Semantic Release](https://semantic-release.gitbook.io/semantic-release/) - Automated version management and package publishing

## Additional Resources

- [AWS Cognito NodeJS Reference](https://medium.com/@sgrharasgama/implementing-and-testing-aws-cognito-in-node-js-applications-5bc435e83184) - Helpful guide for implementing and testing AWS Cognito in Node.js applications.
- [Running with Different Env Files](docs/run-different-env-files.md) - Instructions on how to run the application with different environment files using dotenv-cli.

- [Folder Structure](docs/folder-structure.md) - Overview of the project's directory layout, detailing the purpose and organization of each folder and file to help developers navigate and understand the codebase efficiently.

For more detailed information on these topics, please refer to the documents in the `docs` folder.
