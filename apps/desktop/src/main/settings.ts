import { app } from 'electron';
import fs from 'node:fs/promises';
import path from 'node:path';
import type { AppSettings } from '../shared/ipc-types';

const SETTINGS_FILENAME = 'settings.json';

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  recentProjects: [],
  autoSave: true,
  autoSaveInterval: 30000,
};

function getSettingsPath(): string {
  return path.join(app.getPath('userData'), SETTINGS_FILENAME);
}

/** 读取设置 */
export async function getSettings(): Promise<AppSettings> {
  try {
    const data = await fs.readFile(getSettingsPath(), 'utf-8');
    const parsed = JSON.parse(data) as Partial<AppSettings>;
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

/** 写入设置（部分更新） */
export async function setSettings(
  patch: Partial<AppSettings>,
): Promise<AppSettings> {
  const current = await getSettings();
  const updated = { ...current, ...patch };
  await fs.writeFile(
    getSettingsPath(),
    JSON.stringify(updated, null, 2),
    'utf-8',
  );
  return updated;
}
