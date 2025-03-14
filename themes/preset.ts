import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';
import destr from 'destr';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const theme = destr(fs.readFileSync(path.resolve(__dirname, './theme.json'), 'utf-8'));

function getSize(size: string) {
  // 1rem = 1px
  const sizeNum = Number.parseFloat(size);
  if (size.endsWith('px')) {
    return `${sizeNum}rem`;
  }
  return `${sizeNum * 14}rem`;
}

function replaceSize(str: string) {
  return str.replace(/-?\d?\.?\d+(rem|px)/g, getSize);
}

function parseTheme(theme: any) {
  for (const key in theme) {
    if (typeof theme[key] === 'string') {
      theme[key] = replaceSize(theme[key]);
    }
    else {
      parseTheme(theme[key]);
    }
  }
  return theme;
}

const parsedTheme = definePreset(Aura, parseTheme(theme));

export default parsedTheme;
