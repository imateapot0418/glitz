import chalk from 'chalk';
import { RepoData, AuthorStats, VisualizationOptions, SortField } from '../types';

const MEDALS = ['🥇', '🥈', '🥉'];
const BAR_CHAR = '█';
const MAX_BAR_WIDTH = 25;

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

function renderBar(value: number, maxValue: number): string {
  if (maxValue === 0) return '';
  const width = Math.max(1, Math.round((value / maxValue) * MAX_BAR_WIDTH));
  return chalk.cyan(BAR_CHAR.repeat(width));
}

function padRight(str: string, len: number): string {
  // Account for emoji width (emojis take ~2 columns)
  const visualLength = [...str].reduce((acc, char) => {
    const code = char.codePointAt(0) || 0;
    return acc + (code > 0xFFFF ? 2 : 1);
  }, 0);
  const padding = Math.max(0, len - visualLength);
  return str + ' '.repeat(padding);
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

  const maxValue = Math.max(...sorted.map(a => getSortValue(a, sort)));
  const maxNameLen = Math.max(...sorted.map(a => a.name.length));

  // Header
  const title = `✨ Repo Heroes — ${data.repoName} (${data.branch})`;
  console.log('');
  console.log(chalk.bold.white(title));
  console.log(chalk.dim('─'.repeat(60)));

  // Rows
  for (let i = 0; i < sorted.length; i++) {
    const author = sorted[i];
    const rank = i < 3 ? MEDALS[i] : chalk.dim(` ${i + 1}`);
    const name = padRight(author.name, maxNameLen + 2);
    const bar = renderBar(getSortValue(author, sort), maxValue);
    const commits = chalk.white(`${formatNumber(author.commits)} commits`);
    const added = chalk.green(`+${formatNumber(author.insertions)}`);
    const removed = chalk.red(`-${formatNumber(author.deletions)}`);

    console.log(`${rank} ${name} ${bar}  ${commits}  ${added}  ${removed}`);
  }

  // Footer
  const totalInsertions = data.authors.reduce((sum, a) => sum + a.insertions, 0);
  const totalDeletions = data.authors.reduce((sum, a) => sum + a.deletions, 0);

  console.log(chalk.dim('─'.repeat(60)));
  console.log(
    chalk.dim(
      `   ${data.authors.length} contributors | ` +
      `${formatNumber(data.totalCommits)} commits | ` +
      `${chalk.green(`+${formatNumber(totalInsertions)}`)} | ` +
      `${chalk.red(`-${formatNumber(totalDeletions)}`)}`
    )
  );
  console.log('');
};
