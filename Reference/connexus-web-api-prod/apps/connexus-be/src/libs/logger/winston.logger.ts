import { createLogger, format, LoggerOptions, transports } from 'winston';
import DailyRotateFile = require('winston-daily-rotate-file');
import WinstonCloudWatch = require('winston-cloudwatch');
import S3Transport from 'winston-s3-transport';
import { envValues } from '@app/core';

// custom log display format
const customFormat = format.printf(
  ({ timestamp, level, stack, message, status }) => {
    return `${timestamp} - [${level.toUpperCase().padEnd(7)}] - ${status ? `[${status}] ` : ''}${stack || message}`;
  },
);

// Custom format to filter unknown errors
const filterUnknownErrors = format((info) => {
  if (info.level === 'error') {
    // Check if error is an unknown error (not a known business/validation error)
    const isKnownError = info?.status < 500;

    return isKnownError ? false : info;
  }
  return info;
});

// for development environment
const devLogger: LoggerOptions = {
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    filterUnknownErrors(),
    customFormat,
  ),
  transports: [
    new transports.Console({
      level: 'silly',
    }),
  ],
};

const group = `${envValues.logGroupName}-${envValues.mode}`;

// for production environment
const prodLogger = {
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    filterUnknownErrors(),
    format.json(),
  ),
  transports: [
    new DailyRotateFile({
      filename: `error-%DATE%.log`,
      level: 'error',
      dirname: 'logs',
      datePattern: 'YYYY-MM-DD',
      maxFiles: 10,
      maxSize: '5m',
      format: format.combine(format.timestamp(), format.json()),
    }),
    new WinstonCloudWatch({
      messageFormatter: ({ level, message, timestamp, status }) => {
        return `[${timestamp}] ${level}: ${status ? `[${status}] ` : ''}${message}`;
      },
      awsAccessKeyId: envValues.auth.accessKeyId,
      awsSecretKey: envValues.auth.secretAccessKey,
      awsOptions: {
        region: envValues.auth.region,
      },
      awsRegion: envValues.auth.region,
      logGroupName: group,
      logStreamName: `${envValues.mode}-${new Date().toISOString().split('T')[0]}`,
      errorHandler: (error) => {
        // eslint-disable-next-line no-console
        console.error(error);
      },
      level: 'error',
      name: `connexus-logs-${envValues.mode}`,
    }),
    new S3Transport({
      s3ClientConfig: {
        credentials: {
          accessKeyId: envValues.auth.accessKeyId,
          secretAccessKey: envValues.auth.secretAccessKey,
        },
        region: envValues.auth.region,
      },
      level: 'error',
      s3TransportConfig: {
        bucket: envValues.storage.bucketName,
        bucketPath: () => {
          const timestamp = new Date().toISOString().split('T')[0];
          return `application-logs/${group}/${timestamp}/error.log`;
        },
      },
    }),
    new transports.Console({
      level: 'error',
    }),
  ],
};

// export log instance based on the current environment
const instanceLogger = envValues.mode === 'production' ? prodLogger : devLogger;

export const instance = createLogger(instanceLogger);
