import { mkdir, mkdtemp, rm, symlink } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { spawn } from 'node:child_process';

// Chromium's Unix socket names cannot fit inside Nix's nested TMPDIR.
// Keep its files in task output, reached through a short, uniquely owned alias.
const directory = resolve('agent-output/browser-tmp');
await mkdir(directory, { recursive: true, mode: 0o700 });
const physical = await mkdtemp(join(directory, 'run-'));
const aliasDirectory = await mkdtemp('/tmp/whipper-');
const alias = join(aliasDirectory, 't');
try {
  await symlink(physical, alias, 'dir');
  const child = spawn(process.execPath, [resolve('node_modules/@playwright/test/cli.js'), 'test', ...process.argv.slice(2)], {
    stdio: 'inherit', env: { ...process.env, TMPDIR: alias, TMP: alias, TEMP: alias },
  });
  const interrupt = () => child.kill('SIGINT');
  const terminate = () => child.kill('SIGTERM');
  process.on('SIGINT', interrupt);
  process.on('SIGTERM', terminate);
  try {
    process.exitCode = await new Promise((accept, reject) => {
      child.once('error', reject);
      child.once('exit', code => accept(code ?? 1));
    });
  } finally {
    process.off('SIGINT', interrupt);
    process.off('SIGTERM', terminate);
  }
} finally {
  await rm(aliasDirectory, { recursive: true, force: true });
  await rm(physical, { recursive: true, force: true });
}
