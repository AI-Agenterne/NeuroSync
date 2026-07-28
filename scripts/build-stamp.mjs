/**
 * Write public/build-info.json so the deployed artifact can state which commit
 * it was built from.
 *
 * CANONICAL COPY -- lives at tools/deploy_verify/build-stamp.mjs in the Command
 * Center vault and is copied verbatim into each deployable repo as
 * scripts/build-stamp.mjs. Change it here, then re-run
 * tools/deploy_verify/sync-stamp.sh to push the change out.
 *
 * Why: a stale site and a healthy site return the same status code, so "curl
 * returns 200" is green for the entire window in which a deploy has not landed.
 * The only way to tell them apart is to compare the SERVED bytes against what
 * git says was pushed -- two independently derived facts. That needs the build
 * to sign its own output, which is this file.
 *
 * Never throws: a missing stamp surfaces as STAMP_MISMATCH in verify_deploy.py,
 * which is loud in the right place. Failing the build here would trade a
 * reporting gap for an outage.
 */
import { execSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function fromGit(args) {
  try {
    return execSync(`git ${args}`, { cwd: root, stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim() || null;
  } catch {
    return null; // shallow clone, no git binary, or not a repo
  }
}

// Vercel exposes the commit it checked out; git is the local fallback. Both can
// be absent (CLI deploy from a tarball) -- then commit is null and the verifier
// says so instead of quietly passing.
const commit = process.env.VERCEL_GIT_COMMIT_SHA || fromGit('rev-parse HEAD');
const branch =
  process.env.VERCEL_GIT_COMMIT_REF || fromGit('rev-parse --abbrev-ref HEAD');

const info = {
  commit,
  commitShort: commit ? commit.slice(0, 7) : null,
  branch,
  builtAt: new Date().toISOString(),
  env: process.env.VERCEL_ENV || 'local',
  message: process.env.VERCEL_GIT_COMMIT_MESSAGE?.split('\n')[0] ?? null,
};

const out = join(root, 'public', 'build-info.json');
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(info, null, 2) + '\n');

console.log(
  `[build-stamp] ${info.commitShort ?? 'UNKNOWN COMMIT'} (${info.branch ?? '?'}) ${info.env} -> public/build-info.json`
);
