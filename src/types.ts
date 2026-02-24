export interface CommitData {
  hash: string;
  author: string;
  email: string;
  date: string;
  message: string;
  filesChanged: number;
  insertions: number;
  deletions: number;
}

export interface AuthorStats {
  name: string;
  email: string;
  commits: number;
  insertions: number;
  deletions: number;
  filesChanged: number;
  firstCommit: string;
  lastCommit: string;
}

export interface RepoData {
  repoName: string;
  branch: string;
  totalCommits: number;
  authors: AuthorStats[];
  commits: CommitData[];
}

export type SortField = 'commits' | 'insertions' | 'deletions' | 'net';

export interface VisualizationOptions {
  limit?: number;
  sort?: SortField;
  json?: boolean;
}

export type Visualization = (data: RepoData, options: VisualizationOptions) => void;
