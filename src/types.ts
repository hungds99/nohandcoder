export interface FileInfo {
  path: string;
  content: string;
  size: number;
}

export interface SearchResult {
  file: string;
  line: number;
  content: string;
}

export interface ProjectStructure {
  files: string[];
  directories: string[];
  totalFiles: number;
  totalSize: number;
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
