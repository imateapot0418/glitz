import chalk from 'chalk';
import { RepoData, AuthorStats, VisualizationOptions, SortField } from '../types';

const MEDALS = ['🥇', '🥈', '🥉'];
const COL_RANK = 3;
const COL_AUTHOR = 30;
const COL_COMMITS = 15;
const COL_ADDED = 10;
const COL_REMOVED = 10;
const LINE_WIDTH = COL_RANK + 1 + COL_AUTHOR + 1 + COL_COMMITS + 1 + COL_ADDED + 1 + COL_REMOVED;

function getSortValue(author: AuthorStats, field: SortField): number {
  switch (field) {
    case 'commits':    return author.commits;
    case 'insertions': return author.insertions;
    case 'deletions':  return author.deletions;
    case 'net':        return author.insertions - author.deletions;
  }
}

function formatNumber(n: number): string {
  return n.toLocaleString('en-US');
}

function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 3) + '...';
}

export const heroesVisualization = (data: RepoData, options: VisualizationOptions): void => {
  const { limit = 10, sort = 'commits', json = false } = options;

  if (json) {
    console.log(JSON.stringify(data, null, 2));
    return;
  }

  if (data.authors.length === 0) {
    console.log(chalk.yellow('No commit data found.'));
    return;
  }

  // Sort authors
  const sorted = [...data.authors]
    .sort((a, b) => getSortValue(b, sort) - getSortValue(a, sort))
    .slice(0, limit);

  // Header
  const title = `✨ Repo Heroes — ${data.repoName} (${data.branch})`;
  console.log('');
  console.log(chalk.bold.white(title));
  console.log(chalk.dim('─'.repeat(LINE_WIDTH)));

  // Rows
  for (let i = 0; i < sorted.length; i++) {
    const author = sorted[i];
    const rank = i < 3 ? MEDALS[i].padStart(COL_RANK) : chalk.dim(String(i + 1).padStart(COL_RANK));
    const name = truncate(author.name, COL_AUTHOR).padEnd(COL_AUTHOR);
    const commits = `${formatNumber(author.commits)} commits`.padStart(COL_COMMITS);
    const added = `+${formatNumber(author.insertions)}`.padStart(COL_ADDED);
    const removed = `-${formatNumber(author.deletions)}`.padStart(COL_REMOVED);

    console.log(`${rank} ${name} ${chalk.white(commits)} ${chalk.green(added)} ${chalk.red(removed)}`);
  }

  // Footer
  const totalInsertions = data.authors.reduce((sum, a) => sum + a.insertions, 0);
  const totalDeletions = data.authors.reduce((sum, a) => sum + a.deletions, 0);

  console.log(chalk.dim('─'.repeat(LINE_WIDTH)));
  const summaryLabel = `${data.authors.length} contributors`.padEnd(COL_RANK + 1 + COL_AUTHOR);
  const summaryCommits = `${formatNumber(data.totalCommits)} commits`.padStart(COL_COMMITS);
  const summaryAdded = `+${formatNumber(totalInsertions)}`.padStart(COL_ADDED);
  const summaryRemoved = `-${formatNumber(totalDeletions)}`.padStart(COL_REMOVED);
  console.log(
    chalk.dim(`${summaryLabel} ${summaryCommits}`) +
    ` ${chalk.green(chalk.dim(summaryAdded))}` +
    ` ${chalk.red(chalk.dim(summaryRemoved))}`
  );
  console.log('');
};
