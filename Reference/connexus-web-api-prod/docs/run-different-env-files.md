<!-- Running different environments with dotenv-cli for connexus-web-api -->

# Running with Different Env Files for connexus-web-api

## Install dotenv-cli with npm

To install `dotenv-cli`, use the following npm command:

```sh
npm install -g dotenv-cli
```

## Examples

### Development

```sh
dotenv -e .env.development <your_command_here>
```

### Test Local Env

```sh
 dotenv -e .env.test.local <command>
```
