/**
 * @deprecated This file will be removed in a future update.
 * Template paths are now handled directly in template.ts with webpack path resolution
 */

import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Resolves the correct file path for static assets, handling both development and production environments
 * @param basePath The base path from __dirname
 * @param relativePath The relative path from the base path to the folder
 * @param fileName The name of the file without extension
 * @param extension The file extension
 * @returns The resolved file path
 */
export const resolveAssetPath = (
  basePath: string,
  relativePath: string,
  fileName: string,
  extension: string,
): string => {
  // First try the standard path
  try {
    const standardPath = join(
      basePath,
      relativePath,
      `${fileName}.${extension}`,
    );
    // Check if file exists by attempting to read stats
    readFileSync(standardPath, { encoding: 'utf-8', flag: 'r' });
    return standardPath;
  } catch (error) {
    // If standard path fails, try the webpack path
    try {
      // For webpack bundled environment, we need to modify the path
      const webpackPath = join(
        process.cwd(),
        `dist/apps/connexus-be`,
        relativePath.replace(/^libs\//, ''),
        `${fileName}.${extension}`,
      );
      readFileSync(webpackPath, { encoding: 'utf-8', flag: 'r' });
      return webpackPath;
    } catch (webpackError) {
      // As a fallback, try the old webpack path format
      const fallbackPath = join(
        process.cwd(),
        `dist/apps/connexus-be/${relativePath}`,
        `${fileName}.${extension}`,
      );
      return fallbackPath;
    }
  }
};

/**
 * Resolves the correct file path for templates in the SES module
 * @param folder The template folder (e.g., 'designs')
 * @param fileName The name of the template file without extension
 * @param extension The file extension (defaults to 'hbs')
 * @returns The resolved file path
 */
export const resolveTemplatePath = (
  folder: string,
  fileName: string,
  extension: string = 'hbs',
): string => {
  return resolveAssetPath(
    __dirname,
    `libs/ses/templates/${folder}`,
    fileName,
    extension,
  );
};
