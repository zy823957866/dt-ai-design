import { app } from 'electron';
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  createDocument,
  type DesignDocument,
} from '@dt-ai-design/design-schema';
import type { ProjectMeta, ProjectWithDocument } from '../shared/ipc-types';

const PROJECTS_DIR = 'dt-ai-design/projects';
const DOC_FILENAME = 'document.json';
const META_FILENAME = 'meta.json';

function getProjectsDir(): string {
  return path.join(app.getPath('userData'), PROJECTS_DIR);
}

function getProjectDir(projectId: string): string {
  return path.join(getProjectsDir(), projectId);
}

async function ensureProjectsDir(): Promise<void> {
  await fs.mkdir(getProjectsDir(), { recursive: true });
}

function generateId(): string {
  return `proj_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

/** 读取项目元数据 */
async function readMeta(projectDir: string): Promise<ProjectMeta | null> {
  try {
    const data = await fs.readFile(
      path.join(projectDir, META_FILENAME),
      'utf-8',
    );
    return JSON.parse(data) as ProjectMeta;
  } catch {
    return null;
  }
}

/** 写入项目元数据 */
async function writeMeta(projectDir: string, meta: ProjectMeta): Promise<void> {
  await fs.writeFile(
    path.join(projectDir, META_FILENAME),
    JSON.stringify(meta, null, 2),
    'utf-8',
  );
}

/** 读取设计文档 */
async function readDocument(
  projectDir: string,
): Promise<DesignDocument | null> {
  try {
    const data = await fs.readFile(
      path.join(projectDir, DOC_FILENAME),
      'utf-8',
    );
    return JSON.parse(data) as DesignDocument;
  } catch {
    return null;
  }
}

/** 写入设计文档 */
async function writeDocument(
  projectDir: string,
  doc: DesignDocument,
): Promise<void> {
  await fs.writeFile(
    path.join(projectDir, DOC_FILENAME),
    JSON.stringify(doc, null, 2),
    'utf-8',
  );
}

/** 列出所有项目 */
export async function listProjects(): Promise<ProjectMeta[]> {
  await ensureProjectsDir();
  const entries = await fs.readdir(getProjectsDir(), { withFileTypes: true });
  const dirs = entries.filter((e) => e.isDirectory());

  const projects: ProjectMeta[] = [];
  for (const dir of dirs) {
    const meta = await readMeta(path.join(getProjectsDir(), dir.name));
    if (meta) {
      projects.push(meta);
    }
  }

  // 按更新时间倒序
  projects.sort((a, b) => b.updatedAt - a.updatedAt);
  return projects;
}

/** 创建新项目 */
export async function createProject(
  name: string,
): Promise<ProjectWithDocument> {
  await ensureProjectsDir();

  const id = generateId();
  const projectDir = getProjectDir(id);
  await fs.mkdir(projectDir, { recursive: true });

  const now = Date.now();
  const meta: ProjectMeta = {
    id,
    name,
    createdAt: now,
    updatedAt: now,
  };

  const document = createDocument(name);

  await writeMeta(projectDir, meta);
  await writeDocument(projectDir, document);

  return { ...meta, document };
}

/** 打开项目 */
export async function openProject(
  id: string,
): Promise<ProjectWithDocument | null> {
  const projectDir = getProjectDir(id);

  const meta = await readMeta(projectDir);
  if (!meta) return null;

  const document = await readDocument(projectDir);
  if (!document) return null;

  return { ...meta, document };
}

/** 删除项目 */
export async function deleteProject(id: string): Promise<void> {
  const projectDir = getProjectDir(id);
  await fs.rm(projectDir, { recursive: true, force: true });
}

/** 重命名项目 */
export async function renameProject(id: string, name: string): Promise<void> {
  const projectDir = getProjectDir(id);
  const meta = await readMeta(projectDir);
  if (!meta) return;

  meta.name = name;
  meta.updatedAt = Date.now();
  await writeMeta(projectDir, meta);
}

/** 保存项目文档（可选更新缩略图） */
export async function saveProject(
  id: string,
  doc: DesignDocument,
  thumbnail?: string,
): Promise<void> {
  const projectDir = getProjectDir(id);

  // 确保目录存在
  await fs.mkdir(projectDir, { recursive: true });

  await writeDocument(projectDir, doc);

  // 更新元数据的更新时间与缩略图
  const meta = await readMeta(projectDir);
  if (meta) {
    meta.updatedAt = Date.now();
    if (thumbnail !== undefined) {
      meta.thumbnail = thumbnail;
    }
    await writeMeta(projectDir, meta);
  }
}

/** 导入项目（从 JSON 文件） */
export async function importProject(
  filePath: string,
): Promise<ProjectWithDocument> {
  const data = await fs.readFile(filePath, 'utf-8');
  const doc = JSON.parse(data) as DesignDocument;

  const name = doc.name || 'Imported Design';
  return createProject(name).then(async (project) => {
    await saveProject(project.id, doc);
    const updated = await openProject(project.id);
    return updated!;
  });
}
