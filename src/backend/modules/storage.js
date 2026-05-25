import fs from 'node:fs/promises';
import path from 'node:path';

const SAFE_ID = /^[a-zA-Z0-9_-]+$/;
const GLOBAL_FILES = new Set(['app_registry.json', 'slug_master.json', 'system.json']);
const TENANT_FILES = new Set([
  'settings.json',
  'profile.json',
  'canvas_pages.json',
  'analytics_logs.json',
  'content_feed.json'
]);

function assertAllowedFile(fileName, allowedSet) {
  if (!allowedSet.has(fileName)) {
    const error = new Error('Invalid storage file');
    error.status = 400;
    throw error;
  }
}

function assertSafeTenantId(tenantId) {
  if (!SAFE_ID.test(tenantId)) {
    const error = new Error('Invalid tenant id');
    error.status = 400;
    throw error;
  }
}

function resolveSafePath(baseDir, ...parts) {
  const targetPath = path.resolve(baseDir, ...parts);
  if (targetPath !== baseDir && !targetPath.startsWith(`${baseDir}${path.sep}`)) {
    const error = new Error('Invalid storage path');
    error.status = 400;
    throw error;
  }
  return targetPath;
}

export function createStorage(rootDir) {
  const baseDir = path.resolve(rootDir);

  async function readJsonFile(filePath, fallback = null) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return fallback;
      }
      throw error;
    }
  }

  async function writeJsonFileAtomic(filePath, data) {
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });

    const tmpPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
    const payload = `${JSON.stringify(data, null, 2)}\n`;
    await fs.writeFile(tmpPath, payload, { encoding: 'utf8', mode: 0o600 });
    await fs.rename(tmpPath, filePath);
  }

  async function readGlobalJson(fileName, fallback = null) {
    assertAllowedFile(fileName, GLOBAL_FILES);
    const filePath = resolveSafePath(baseDir, 'global', fileName);
    return readJsonFile(filePath, fallback);
  }

  async function readTenantJson(tenantId, fileName, fallback = null) {
    assertSafeTenantId(tenantId);
    assertAllowedFile(fileName, TENANT_FILES);
    const filePath = resolveSafePath(baseDir, 'tenants', tenantId, fileName);
    return readJsonFile(filePath, fallback);
  }

  async function updateTenantJson(tenantId, fileName, updater, fallback = {}) {
    assertSafeTenantId(tenantId);
    assertAllowedFile(fileName, TENANT_FILES);
    const filePath = resolveSafePath(baseDir, 'tenants', tenantId, fileName);
    const current = (await readJsonFile(filePath, fallback)) ?? fallback;
    const updated = await updater(current);
    await writeJsonFileAtomic(filePath, updated);
    return updated;
  }

  return {
    readGlobalJson,
    readTenantJson,
    updateTenantJson
  };
}
