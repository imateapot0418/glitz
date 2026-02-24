import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { CommitData, AuthorStats, RepoData, CollectorOptions } from '../types';

const COMMIT_SEPARATOR = '---GLITZ_COMMIT---';
const FIELD_SEPARATOR = '---GLITZ_FIELD---';

/**
 * Collect git log data from a repository and return structured RepoData.
 */
export function collectGitLog(repoPath: string, options: CollectorOptions = {}): RepoData {
  const absPath = path.resolve(repoPath);

  // Validate git is available
  try {
    execSync('git --version', { stdio: 'pipe' });
  } catch {
    throw new Error('Git is not installed or not in PATH');
  }

  // Validate path exists and is a directory
  if (!fs.existsSync(absPath)) {
    throw new Error(`Path does not exist: ${absPath}`);
  }
  if (!fs.statSync(absPath).isDirectory()) {
    throw new Error(`Path is not a directory: ${absPath}`);
  }

  // Verify it's a git repo
  try {
    execSync('git rev-parse --is-inside-work-tree', { cwd: absPath, stdio: 'pipe' });
  } catch {
    throw new Error(`Not a git repository: ${absPath}`);
  }

  const repoName = getRepoName(absPath);
  const branch = getCurrentBranch(absPath);

  process.stderr.write('Collecting commit data...\n');
  const commits = getCommits(absPath, options);
  const authors = aggregateAuthorStats(commits);

  return {
    repoName,
    branch,
    totalCommits: commits.length,
    authors,
    commits,
  };
}

function getRepoName(repoPath: string): string {
  try {
    const remoteUrl = execSync('git remote get-url origin', { cwd: repoPath, stdio: 'pipe' })
      .toString()
      .trim();
    // Extract repo name from URL (handles both HTTPS and SSH)
    const match = remoteUrl.match(/\/([^/]+?)(?:\.git)?$/);
    if (match) return match[1];
  } catch {
    // No remote, fall back to directory name
  }
  return path.basename(repoPath);
}

function getCurrentBranch(repoPath: string): string {
  try {
    return execSync('git rev-parse --abbrev-ref HEAD', { cwd: repoPath, stdio: 'pipe' })
      .toString()
      .trim();
  } catch {
    process.stderr.write('Warning: Could not determine current branch, using "unknown"\n');
    return 'unknown';
  }
}

function getCommits(repoPath: string, options: CollectorOptions = {}): CommitData[] {
  const format = [
    '%H',   // hash
    '%aN',  // author name (respects .mailmap)
    '%aE',  // author email (respects .mailmap)
    '%aI',  // author date ISO
    '%s',   // subject
  ].join(FIELD_SEPARATOR);

  const args = ['git', 'log'];
  if (!options.includeMerges) {
    args.push('--no-merges');
  }
  if (options.since) {
    args.push(`--since="${options.since}"`);
  }
  args.push('--numstat', `--format="${COMMIT_SEPARATOR}${format}"`);

  let output: string;
  try {
    output = execSync(
      args.join(' '),
      { cwd: repoPath, stdio: 'pipe', maxBuffer: 50 * 1024 * 1024 }
    ).toString();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to read git log: ${message}`);
  }

  const rawCommits = output.split(COMMIT_SEPARATOR).filter(s => s.trim());
  const commits: CommitData[] = [];

  for (const raw of rawCommits) {
    const lines = raw.trim().split('\n');
    if (lines.length === 0) continue;

    const fields = lines[0].split(FIELD_SEPARATOR);
    if (fields.length < 5) continue;

    const [hash, author, email, date, message] = fields;

    let insertions = 0;
    let deletions = 0;
    let filesChanged = 0;

    // numstat lines follow the header (after any blank lines)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const parts = line.split('\t');
      if (parts.length >= 2) {
        const added = parseInt(parts[0], 10);
        const removed = parseInt(parts[1], 10);
        if (!isNaN(added)) insertions += added;
        if (!isNaN(removed)) deletions += removed;
        filesChanged++;
      }
    }

    commits.push({
      hash,
      author,
      email,
      date,
      message,
      filesChanged,
      insertions,
      deletions,
    });
  }

  return commits;
}

export function aggregateAuthorStats(commits: CommitData[]): AuthorStats[] {
  const statsMap = new Map<string, AuthorStats>();

  for (const commit of commits) {
    const key = commit.email.toLowerCase();
    const existing = statsMap.get(key);

    if (existing) {
      existing.commits++;
      existing.insertions += commit.insertions;
      existing.deletions += commit.deletions;
      existing.filesChanged += commit.filesChanged;

      // Track earliest and latest commits
      if (commit.date < existing.firstCommit) {
        existing.firstCommit = commit.date;
      }
      if (commit.date > existing.lastCommit) {
        existing.lastCommit = commit.date;
      }
    } else {
      statsMap.set(key, {
        name: commit.author,
        email: commit.email,
        commits: 1,
        insertions: commit.insertions,
        deletions: commit.deletions,
        filesChanged: commit.filesChanged,
        firstCommit: commit.date,
        lastCommit: commit.date,
      });
    }
  }

  return Array.from(statsMap.values());
}
