import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { aggregateAuthorStats } from '../collectors/git-log';
import { collectGitLog } from '../collectors/git-log';
import { CommitData } from '../types';

// --- aggregateAuthorStats ---

describe('aggregateAuthorStats', () => {
  it('returns empty array for empty input', () => {
    const result = aggregateAuthorStats([]);
    assert.deepEqual(result, []);
  });

  it('aggregates stats for a single author', () => {
    const commits: CommitData[] = [
      { hash: 'a1', author: 'Alice', email: 'alice@test.com', date: '2024-01-01T00:00:00Z', message: 'first', filesChanged: 2, insertions: 10, deletions: 3 },
      { hash: 'a2', author: 'Alice', email: 'alice@test.com', date: '2024-02-01T00:00:00Z', message: 'second', filesChanged: 1, insertions: 5, deletions: 1 },
    ];

    const result = aggregateAuthorStats(commits);
    assert.equal(result.length, 1);
    assert.equal(result[0].name, 'Alice');
    assert.equal(result[0].commits, 2);
    assert.equal(result[0].insertions, 15);
    assert.equal(result[0].deletions, 4);
    assert.equal(result[0].filesChanged, 3);
  });

  it('groups by email (case-insensitive)', () => {
    const commits: CommitData[] = [
      { hash: 'a1', author: 'Alice', email: 'Alice@Test.COM', date: '2024-01-01T00:00:00Z', message: 'one', filesChanged: 1, insertions: 10, deletions: 0 },
      { hash: 'a2', author: 'Alice Chen', email: 'alice@test.com', date: '2024-02-01T00:00:00Z', message: 'two', filesChanged: 1, insertions: 5, deletions: 0 },
    ];

    const result = aggregateAuthorStats(commits);
    assert.equal(result.length, 1);
    assert.equal(result[0].commits, 2);
    assert.equal(result[0].insertions, 15);
  });

  it('separates different authors', () => {
    const commits: CommitData[] = [
      { hash: 'a1', author: 'Alice', email: 'alice@test.com', date: '2024-01-01T00:00:00Z', message: 'one', filesChanged: 1, insertions: 10, deletions: 0 },
      { hash: 'b1', author: 'Bob', email: 'bob@test.com', date: '2024-01-02T00:00:00Z', message: 'two', filesChanged: 2, insertions: 20, deletions: 5 },
    ];

    const result = aggregateAuthorStats(commits);
    assert.equal(result.length, 2);

    const alice = result.find(a => a.name === 'Alice');
    const bob = result.find(a => a.name === 'Bob');
    assert.ok(alice);
    assert.ok(bob);
    assert.equal(alice.commits, 1);
    assert.equal(bob.commits, 1);
    assert.equal(bob.insertions, 20);
  });

  it('tracks first and last commit dates', () => {
    const commits: CommitData[] = [
      { hash: 'a1', author: 'Alice', email: 'alice@test.com', date: '2024-03-15T00:00:00Z', message: 'middle', filesChanged: 1, insertions: 1, deletions: 0 },
      { hash: 'a2', author: 'Alice', email: 'alice@test.com', date: '2024-01-01T00:00:00Z', message: 'earliest', filesChanged: 1, insertions: 1, deletions: 0 },
      { hash: 'a3', author: 'Alice', email: 'alice@test.com', date: '2024-06-30T00:00:00Z', message: 'latest', filesChanged: 1, insertions: 1, deletions: 0 },
    ];

    const result = aggregateAuthorStats(commits);
    assert.equal(result[0].firstCommit, '2024-01-01T00:00:00Z');
    assert.equal(result[0].lastCommit, '2024-06-30T00:00:00Z');
  });

  it('handles binary file stats (NaN insertions/deletions)', () => {
    // Binary files show as "-\t-\tfilename" in numstat, which parses to NaN
    // Our collector skips NaN values, so they contribute 0 to insertions/deletions
    const commits: CommitData[] = [
      { hash: 'a1', author: 'Alice', email: 'alice@test.com', date: '2024-01-01T00:00:00Z', message: 'add binary', filesChanged: 1, insertions: 0, deletions: 0 },
    ];

    const result = aggregateAuthorStats(commits);
    assert.equal(result[0].insertions, 0);
    assert.equal(result[0].deletions, 0);
    assert.equal(result[0].filesChanged, 1);
  });
});

// --- collectGitLog input validation ---

describe('collectGitLog', () => {
  it('throws for nonexistent path', () => {
    assert.throws(
      () => collectGitLog('/nonexistent/path/that/does/not/exist'),
      { message: /Path does not exist/ },
    );
  });

  it('throws for a file path instead of directory', () => {
    assert.throws(
      () => collectGitLog(__filename),
      { message: /Path is not a directory/ },
    );
  });

  it('throws for a non-git directory', () => {
    // /tmp should exist and not be a git repo
    assert.throws(
      () => collectGitLog('/tmp'),
      { message: /Not a git repository/ },
    );
  });

  it('returns valid RepoData for a real git repo', () => {
    // Use the glitz repo itself
    const data = collectGitLog(process.cwd());
    assert.ok(data.repoName);
    assert.ok(data.branch);
    assert.ok(typeof data.totalCommits === 'number');
    assert.ok(Array.isArray(data.authors));
    assert.ok(Array.isArray(data.commits));
  });
});
