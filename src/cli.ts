#!/usr/bin/env node

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { collectGitLog } from './collectors/git-log';
import { getVisualization, getAvailableVisualizations } from './visualizations';
import { SortField } from './types';

yargs(hideBin(process.argv))
  .scriptName('glitz')
  .usage('$0 <command> [options]')
  .command(
    'heroes [path]',
    'Show a ranked leaderboard of repo contributors',
    (yargs) => {
      return yargs
        .positional('path', {
          describe: 'Path to git repository',
          type: 'string',
          default: '.',
        })
        .option('limit', {
          alias: 'l',
          describe: 'Number of authors to show',
          type: 'number',
          default: 10,
        })
        .option('sort', {
          alias: 's',
          describe: 'Sort authors by metric',
          choices: ['commits', 'insertions', 'deletions', 'net'] as const,
          default: 'commits' as SortField,
        })
        .option('json', {
          describe: 'Output raw data as JSON',
          type: 'boolean',
          default: false,
        });
    },
    (argv) => {
      try {
        const data = collectGitLog(argv.path as string);
        const viz = getVisualization('heroes');
        if (viz) {
          viz(data, {
            limit: argv.limit,
            sort: argv.sort as SortField,
            json: argv.json,
          });
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`Error: ${message}`);
        process.exit(1);
      }
    },
  )
  .demandCommand(1, 'Run "glitz --help" to see available commands')
  .recommendCommands()
  .strict()
  .help()
  .alias('help', 'h')
  .version()
  .alias('version', 'v')
  .epilogue('Available visualizations: ' + getAvailableVisualizations().join(', '))
  .parse();
