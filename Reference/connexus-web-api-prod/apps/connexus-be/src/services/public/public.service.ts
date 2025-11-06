import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { envValues } from '@app/core';
import { getTemplate } from 'src/libs/ses/templates/template';
import { SesService } from '../../libs/ses/ses.service';
import { GetInTouchDto } from './dto/get-in-touch.dto';

@Injectable()
export class PublicService {
  constructor(
    private readonly sesService: SesService,
    private readonly configService: ConfigService,
  ) {}

  async sendGetInTouchEmail(getInTouchDto: GetInTouchDto) {
    const subject = 'Connexus | New Get in Touch Submission';
    const body = getTemplate({
      type: 'get-in-touch-mail',
      data: {
        ...getInTouchDto,
        assetUrl: envValues.emailAssetUrl,
      },
    });

    await this.sesService.sendEmail(envValues.adminEmail, subject, body);

    return { message: 'Your message has been sent successfully.' };
  }
}
