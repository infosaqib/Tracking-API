import { SESv2Client } from '@aws-sdk/client-sesv2';
import { envValues } from '@app/core';

export const sesClient = new SESv2Client({
  region: envValues.auth.region,
});
