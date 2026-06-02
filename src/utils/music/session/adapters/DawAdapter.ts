import type { SessionBundle } from "../models/SessionBundle";

export interface DawExportResult {
  filename: string;
  content: Uint8Array | string;
  mimeType: string;
}

export interface DawExportBundle {
  projectFile: DawExportResult;
  assets?: DawExportResult[];
}

export interface DawAdapter {
  export(session: SessionBundle, options?: any): DawExportBundle;
  import?(project: Uint8Array | string): SessionBundle;
  canImport?(): boolean;
}
