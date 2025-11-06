import { readFileSync } from 'fs';
import Handlebars from 'handlebars';
import { join } from 'path';
import { GetInTouchType } from './types/get-in-touch.type';
import { SendInvitationType } from './types/send-invitation.type';

export type MailTemplateInput = SendInvitationType | GetInTouchType;

/**
 * Loads and compiles a Handlebars template from the filesystem
 * Uses webpack paths in production and source paths in development
 */
const getFiletContent = (fileName: MailTemplateInput['type']) => {
  try {
    // In development, template will be in the source directory
    // In production (webpack), it will be in the dist directory
    let templatePath: string;

    if (process.env.NODE_ENV === 'production') {
      // In production, use the assets copied by webpack CopyPlugin
      templatePath = join(
        process.cwd(),
        'dist/apps/connexus-be/libs/ses/templates/designs',
        `${fileName}.hbs`,
      );
    } else {
      // In development
      templatePath = join(
        process.cwd(),
        'apps/connexus-be/src/libs/ses/templates/designs',
        `${fileName}.hbs`,
      );
    }

    const source = readFileSync(templatePath, 'utf8');
    const template = Handlebars.compile(source);
    return template;
  } catch (error) {
    throw new Error(
      `Failed to load template "${fileName}": ${(error as Error).message}`,
    );
  }
};

/**
 * Renders a template with the given data
 */
export const getTemplate = (input: MailTemplateInput): string => {
  const template = getFiletContent(input.type);
  const templateData = { ...input.data };
  const html = template(templateData);
  return html;
};
