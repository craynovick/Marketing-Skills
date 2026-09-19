import { build } from 'esbuild';
import { chmod, mkdir, copyFile, rm } from 'node:fs/promises';
await rm('packages/cookbook-mcp/dist',{recursive:true,force:true});
await mkdir('packages/cookbook-mcp/dist',{recursive:true});
await build({entryPoints:['packages/cookbook-mcp/src/cli.ts'],bundle:true,platform:'node',target:'node22',format:'esm',outfile:'packages/cookbook-mcp/dist/cli.mjs',banner:{js:'#!/usr/bin/env node\nimport { createRequire } from "node:module"; const require = createRequire(import.meta.url);'}});
await chmod('packages/cookbook-mcp/dist/cli.mjs',0o755);
await copyFile('docs/cookbook-integration.md','packages/cookbook-mcp/README.md');
