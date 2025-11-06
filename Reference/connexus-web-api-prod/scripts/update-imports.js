#!/usr/bin/env node

/**
 * Script to update import statements in files to use the @app/core library instead of local constants
 *
 * Usage:
 *   node scripts/update-imports.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Patterns to replace
const importPatterns = [
  {
    from: /import\s+{\s*(.*?)\s*}\s+from\s+['"]src\/constants\/validator-options['"]/g,
    to: "import { $1 } from '@app/core'",
  },
  {
    from: /import\s+{\s*(.*?)\s*}\s+from\s+['"]src\/constants\/prisma-error-status['"]/g,
    to: "import { $1 } from '@app/core'",
  },
  {
    from: /import\s+{\s*(.*?)\s*}\s+from\s+['"]src\/constants\/configs['"]/g,
    to: "import { $1 } from '@app/core'",
  },
  {
    from: /import\s+{\s*(.*?)\s*}\s+from\s+['"]src\/constants\/pagination['"]/g,
    to: "import { $1 } from '@app/core'",
  },
  {
    from: /import\s+{\s*(.*?)\s*}\s+from\s+['"]src\/constants\/messages['"]/g,
    to: "import { $1 } from '@app/core'",
  },
  {
    from: /import\s+{\s*(.*?)\s*}\s+from\s+['"]src\/constants\/envValues['"]/g,
    to: "import { $1 } from '@app/core'",
  },
  {
    from: /import\s+{\s*(.*?)\s*}\s+from\s+['"]\.\.\/\.\.\/constants\/envValues['"]/g,
    to: "import { $1 } from '@app/core'",
  },
  {
    from: /import\s+{\s*(.*?)\s*}\s+from\s+['"]\.\.\/\.\.\/\.\.\/constants\/envValues['"]/g,
    to: "import { $1 } from '@app/core'",
  },
  {
    from: /import\s+{\s*(.*?)\s*}\s+from\s+['"]\.\.\/\.\.\/src\/constants\/envValues['"]/g,
    to: "import { $1 } from '@app/core'",
  },
  {
    from: /import\s+{\s*(.*?)\s*}\s+from\s+['"]\.\.\/\.\.\/\.\.\/src\/constants\/envValues['"]/g,
    to: "import { $1 } from '@app/core'",
  },
];

// Find TypeScript files in apps directory
const findTsFiles = (dir, fileList = []) => {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      findTsFiles(filePath, fileList);
    } else if (file.endsWith('.ts')) {
      fileList.push(filePath);
    }
  });

  return fileList;
};

// Exclude node_modules and dist directories
const isExcluded = (filePath) => {
  return (
    filePath.includes('node_modules') ||
    filePath.includes('dist') ||
    filePath.includes('libs/core/src/constants') ||
    filePath.includes('scripts/update-imports.js')
  );
};

// Process a file and update its imports
const processFile = (filePath) => {
  if (isExcluded(filePath)) {
    return false;
  }

  let content;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    console.error(`Error reading file ${filePath}:`, err);
    return false;
  }

  let updatedContent = content;
  let hasChanges = false;

  importPatterns.forEach((pattern) => {
    if (pattern.from.test(updatedContent)) {
      updatedContent = updatedContent.replace(pattern.from, pattern.to);
      hasChanges = true;
    }
  });

  if (hasChanges) {
    try {
      fs.writeFileSync(filePath, updatedContent, 'utf8');
      console.log(`Updated imports in ${filePath}`);
      return true;
    } catch (err) {
      console.error(`Error writing to file ${filePath}:`, err);
      return false;
    }
  }

  return false;
};

// Main execution
console.log('Starting to update import statements...');

const appsDir = path.join(__dirname, '..', 'apps');
const libsDir = path.join(__dirname, '..', 'libs');
const prismaDir = path.join(__dirname, '..', 'prisma');
const scriptsDir = path.join(__dirname, '..');

let tsFiles = [];
tsFiles = tsFiles.concat(findTsFiles(appsDir));
tsFiles = tsFiles.concat(findTsFiles(libsDir));
tsFiles = tsFiles.concat(findTsFiles(prismaDir));
tsFiles = tsFiles.concat(findTsFiles(scriptsDir));

let updateCount = 0;
tsFiles.forEach((file) => {
  if (processFile(file)) {
    updateCount++;
  }
});

console.log(`Completed! Updated imports in ${updateCount} files.`);
