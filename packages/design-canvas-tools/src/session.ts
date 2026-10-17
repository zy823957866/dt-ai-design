import { createContext, runInContext } from 'node:vm';

import { generateId, type DesignDocument } from '@dt-ai-design/design-schema';

import { createCanvasApi, type CanvasState } from './api';
import { CanvasToolError } from './errors';
import type {
  CanvasEdit,
  CanvasSession,
  ExecuteOptions,
  ExecuteResult,
} from './types';

const EXECUTE_TIMEOUT_MS = 5000;

const applyEdits = (code: string, edits: CanvasEdit[]): string => {
  let result = code;
  for (const edit of edits) {
    if (edit.all) {
      if (!result.includes(edit.find)) {
        throw new CanvasToolError(
          'edit-not-found',
          `edits.find was not found in the snippet: ${edit.find}`,
        );
      }
      result = result.split(edit.find).join(edit.replace);
    } else {
      if (!result.includes(edit.find)) {
        throw new CanvasToolError(
          'edit-not-found',
          `edits.find was not found in the snippet: ${edit.find}`,
        );
      }
      result = result.replace(edit.find, edit.replace);
    }
  }
  return result;
};

const emptyResult = (revision: number): ExecuteResult => ({
  ok: true,
  revision,
  refs: {},
  output: [],
  warnings: [],
  screenshotNodeIds: [],
  documentChanged: false,
});

export const createCanvasSession = (
  document: DesignDocument,
): CanvasSession => {
  const state: CanvasState = {
    doc: structuredClone(document),
    revision: 0,
    placeholders: new Set<string>(),
    dirty: false,
    refs: {},
    output: [],
    warnings: [],
    screenshots: [],
  };

  const api = createCanvasApi(state);
  const sandbox: Record<string, unknown> = { ...api };
  const context = createContext(sandbox);
  const editRegistry = new Map<string, string>();

  const lastOutput: string[] = [];

  const execute = (
    code: string,
    options: ExecuteOptions = {},
  ): ExecuteResult => {
    // 在开始前重置本轮收集器
    state.dirty = false;
    state.refs = {};
    state.output = [];
    state.warnings = [];
    state.screenshots = [];

    const docSnapshot = structuredClone(state.doc);
    const placeholdersSnapshot = new Set(state.placeholders);
    const globalsBefore = new Set(Object.keys(sandbox));
    const revisionBefore = state.revision;

    let snippet = code;
    try {
      if (options.editId) {
        const stored = editRegistry.get(options.editId);
        if (stored !== undefined)
          snippet = applyEdits(stored, options.edits ?? []);
      } else if (options.edits?.length) {
        snippet = applyEdits(code, options.edits);
      }

      runInContext(snippet, context, {
        timeout: EXECUTE_TIMEOUT_MS,
        filename: 'execute.js',
      });

      if (state.dirty) state.revision = revisionBefore + 1;
      if (options.editId) editRegistry.delete(options.editId);

      const result: ExecuteResult = {
        ...emptyResult(state.revision),
        refs: state.refs,
        output: state.output,
        warnings: state.warnings,
        screenshotNodeIds: state.screenshots,
        documentChanged: state.dirty,
      };
      lastOutput.length = 0;
      lastOutput.push(...result.output);
      return result;
    } catch (error) {
      state.doc = docSnapshot;
      state.placeholders = placeholdersSnapshot;
      state.revision = revisionBefore;
      const addedGlobals = Object.keys(sandbox).filter(
        (key) => !globalsBefore.has(key),
      );
      if (addedGlobals.length > 0) {
        const cleanup = addedGlobals
          .map((key) => `delete globalThis[${JSON.stringify(key)}]`)
          .join(';');
        try {
          runInContext(cleanup, context);
        } catch {
          /* best-effort global cleanup */
        }
      }

      const editId = options.editId ?? generateId('edit');
      editRegistry.set(editId, snippet);

      state.dirty = false;
      state.refs = {};
      state.output = [];
      state.warnings = [];
      state.screenshots = [];
      lastOutput.length = 0;

      return {
        ...emptyResult(revisionBefore),
        ok: false,
        error: {
          message: error instanceof Error ? error.message : String(error),
          editId,
        },
      };
    }
  };

  return {
    document: () => state.doc,
    revision: () => state.revision,
    placeholders: () => [...state.placeholders],
    lastOutput,
    execute,
    replaceDocument: (next: DesignDocument) => {
      state.doc = structuredClone(next);
      state.revision = state.revision + 1;
      state.dirty = true;
      return state.revision;
    },
  };
};
