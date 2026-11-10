/** Download user-supplied reference assets without modifying dependency files. */
import { readFile, mkdir, rename, rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
const root = new URL('../', import.meta.url);
const source = await readFile(new URL('src/runway/data.ts', root), 'utf8');
await mkdir(new URL('src/runway/assets/', root), { recursive: true });
for (const [key, name] of [['MODEL_SOURCE','models'], ['PIECE_SOURCE','pieces']]) {
  const url = source.match(new RegExp(`export const ${key} = '([^']+)';`))?.[1];
  if (!url) throw new Error(`Missing ${key}`);
  const dest = new URL(`src/runway/assets/${name}.webp`, root);
  const temp = new URL(`src/runway/assets/${name}.webp.download`, root);
  try {
    execFileSync('curl', ['--fail','--location','--silent','--show-error','--max-time','60',url,'--output',temp.pathname], { stdio:'inherit' });
    const bytes=await readFile(temp);
    if(bytes.subarray(0,4).toString()!=='RIFF' || bytes.subarray(8,12).toString()!=='WEBP') throw new Error(`${name}: response is not WebP`);
    await rename(temp,dest);
    console.log(`${name}: ${bytes.length} bytes, SHA256 ${createHash('sha256').update(bytes).digest('hex')}`);
  } finally { await rm(temp,{force:true}); }
}
console.log('Rebuild to activate the local reference sprites: npm run build');
