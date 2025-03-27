export interface FileInfo {
  path: string;
  content: string;
  size: number;
  modified: Date;
}

export interface SearchResult {
  file: string;
  line: number;
  content: string;
}

export interface ProjectStructure {
  totalFiles: number;
  totalSize: number;
  directories: string[];
  files: Array<{
    path: string;
    size: number;
    modified: Date;
  }>;
}

export interface EditResult {
  success: boolean;
  message: string;
  file?: string;
}

export interface CommandResult {
  success: boolean;
  output: string;
  error?: string;
}
