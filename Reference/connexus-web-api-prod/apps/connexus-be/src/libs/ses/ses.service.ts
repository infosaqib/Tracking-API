import { envValues } from '@app/core';
import { SendEmailCommand, SendEmailCommandInput } from '@aws-sdk/client-sesv2';
import { Injectable } from '@nestjs/common';
import { SendCustomVerificationEmailDto } from './dto/send-custom-verification-email.dto';
import { sesClient } from './ses-client';
import { getTemplate } from './templates/template';

@Injectable()
export class SesService {
  async sendCustomVerificationEmail(input: SendCustomVerificationEmailDto) {
    const emailInput: SendEmailCommandInput = {
      Content: {
        Simple: {
          Body: {
            Html: {
              Data: getTemplate({
                type: 'custom-verification-email',
                data: {
                  name: input.name,
                  link: input.verificationLink,
                  assetUrl: envValues.emailAssetUrl,
                },
              }),
            },
          },
          Subject: {
            Data: 'Email Verification | Connexus',
          },
        },
      },
      Destination: {
        ToAddresses: [input.email],
      },
      FromEmailAddress: 'support@joinconnexus.com',
    };

    const command = new SendEmailCommand(emailInput);
    const response = await sesClient.send(command);

    return response;
  }

  async sendEmail(toEmail: string, subject: string, body: string) {
    const emailInput: SendEmailCommandInput = {
      Content: {
        Simple: {
          Body: {
            Html: {
              Data: body,
            },
          },
          Subject: {
            Data: subject,
          },
        },
      },
      Destination: {
        ToAddresses: [toEmail],
      },
      FromEmailAddress: 'support@joinconnexus.com',
    };

    const command = new SendEmailCommand(emailInput);
    const response = await sesClient.send(command);

    return response;
  }
}
