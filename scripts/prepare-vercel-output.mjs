import { rm } from 'node:fs/promises';
import { resolve } from 'node:path';

const outputRoot = resolve(import.meta.dirname, '..', '.vercel/output');

await rm(outputRoot, { recursive: true, force: true });
