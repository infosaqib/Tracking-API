import { LoggerService as NestLoggerService } from '@nestjs/common';

export class LoggerService implements NestLoggerService {
  private gray(text: string) { return `\x1b[90m${text}\x1b[0m`; }
  private green(text: string) { return `\x1b[32m${text}\x1b[0m`; }
  private yellow(text: string) { return `\x1b[33m${text}\x1b[0m`; }
  private red(text: string) { return `\x1b[31m${text}\x1b[0m`; }
  private cyan(text: string) { return `\x1b[36m${text}\x1b[0m`; }
  private magenta(text: string) { return `\x1b[35m${text}\x1b[0m`; }

  log(message: string, context?: string) {
    const ts = this.gray(`[${new Date().toISOString()}]`);
    const lvl = this.green('[LOG]');
    const ctx = context ? this.cyan(`[${context}]`) + ' ' : '';
    console.log(`${ts} ${lvl} ${ctx}${message}`);
  }

  error(message: string, trace?: string, context?: string) {
    const ts = this.gray(`[${new Date().toISOString()}]`);
    const lvl = this.red('[ERROR]');
    const ctx = context ? this.cyan(`[${context}]`) + ' ' : '';
    console.error(`${ts} ${lvl} ${ctx}${message}${trace ? `\n${this.gray(trace)}` : ''}`);
  }

  warn(message: string, context?: string) {
    const ts = this.gray(`[${new Date().toISOString()}]`);
    const lvl = this.yellow('[WARN]');
    const ctx = context ? this.cyan(`[${context}]`) + ' ' : '';
    console.warn(`${ts} ${lvl} ${ctx}${message}`);
  }

  debug(message: string, context?: string) {
    if (process.env.NODE_ENV === 'development') {
      const ts = this.gray(`[${new Date().toISOString()}]`);
      const lvl = this.magenta('[DEBUG]');
      const ctx = context ? this.cyan(`[${context}]`) + ' ' : '';
      console.debug(`${ts} ${lvl} ${ctx}${message}`);
    }
  }

  verbose(message: string, context?: string) {
    if (process.env.NODE_ENV === 'development') {
      const ts = this.gray(`[${new Date().toISOString()}]`);
      const lvl = this.magenta('[VERBOSE]');
      const ctx = context ? this.cyan(`[${context}]`) + ' ' : '';
      console.log(`${ts} ${lvl} ${ctx}${message}`);
    }
  }
}

