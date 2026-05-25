import express from 'express';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import rateLimit from 'express-rate-limit';
import { authenticateJWT, requireRoles } from './middleware/authz.js';
import { signToken, verifyPassword } from './modules/auth.js';
import { createStorage } from './modules/storage.js';
import {
  validateAnalyticsEvent,
  validateCanvasDocument,
  validateEntitlements
} from '../shared/schemas/validators.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '../..');
const DATA_ROOT = path.join(ROOT, 'data');
const PORT = Number(process.env.PORT || 3000);
const PRODUCT_SKU = process.env.PRODUCT_SKU || 'aurajam';
const storage = createStorage(DATA_ROOT);
const globalLimiter = rateLimit({
  windowMs: 60_000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false
});
const authLimiter = rateLimit({
  windowMs: 60_000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false
});
const adminLimiter = rateLimit({
  windowMs: 60_000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false
});

const app = express();
app.use(express.json({ limit: '256kb' }));
app.use(globalLimiter);
app.use(authenticateJWT);

const safeIdPattern = /^[a-zA-Z0-9_-]+$/;

function assertSafeId(value, fieldName) {
  if (!safeIdPattern.test(value)) {
    const error = new Error(`Invalid ${fieldName}`);
    error.status = 400;
    throw error;
  }
}

async function loadGlobalRegistry() {
  return (await storage.readGlobalJson('app_registry.json', { apps: [] })) ?? { apps: [] };
}

async function loadSlugMaster() {
  return (await storage.readGlobalJson('slug_master.json', { slugs: [] })) ?? { slugs: [] };
}

async function findUserByEmail(email) {
  const system = await storage.readGlobalJson('system.json', { users: [] });
  const superUser = system.users.find((user) => user.account_email === email);
  if (superUser) {
    return { tenantId: null, ...superUser };
  }

  const tenantBase = path.join(DATA_ROOT, 'tenants');
  const entries = await fs.readdir(tenantBase, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const settings = await storage.readTenantJson(entry.name, 'settings.json');
    const authProfile = settings?.auth_profile;
    if (authProfile?.account_email === email) {
      return {
        tenantId: entry.name,
        account_email: authProfile.account_email,
        security_hash: authProfile.security_hash,
        account_role: authProfile.account_role
      };
    }
  }

  return null;
}

function requireTenantAccess(req, res, next) {
  const tenantId = req.params.tenantId;
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.user.role === 'super-admin') {
    return next();
  }

  if (req.user.tenantId !== tenantId) {
    return res.status(403).json({ error: 'Forbidden tenant scope' });
  }

  return next();
}

app.get('/api/v1/core/health', (_req, res) => {
  res.json({ status: 'ok', sku: PRODUCT_SKU, timestamp: new Date().toISOString() });
});

app.get('/api/v1/core/manifest', async (req, res, next) => {
  try {
    const sku = String(req.query.sku || PRODUCT_SKU);
    const registry = await loadGlobalRegistry();
    const appManifest = registry.apps.find((item) => item.sku === sku);
    if (!appManifest) {
      return res.status(404).json({ error: 'SKU not found' });
    }
    return res.json({ manifest: appManifest });
  } catch (error) {
    return next(error);
  }
});

app.post(
  '/api/v1/core/auth/login',
  authLimiter,
  async (req, res, next) => {
    try {
      const { email, password } = req.body || {};
      if (typeof email !== 'string' || typeof password !== 'string') {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      const user = await findUserByEmail(email.toLowerCase());
      if (!user || !verifyPassword(password, user.security_hash)) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = signToken({
        role: user.account_role,
        email: user.account_email,
        tenantId: user.tenantId
      });

      return res.json({
        token,
        role: user.account_role,
        tenantId: user.tenantId
      });
    } catch (error) {
      return next(error);
    }
  }
);

app.get('/api/v1/tenant/resolve', async (req, res, next) => {
  try {
    const slug = String(req.query.slug || '').trim();
    if (!slug) {
      return res.status(400).json({ error: 'slug is required' });
    }

    const slugMaster = await loadSlugMaster();
    const result = slugMaster.slugs.find((item) => item.slug === slug);
    if (!result) {
      return res.status(404).json({ error: 'Slug not found' });
    }

    return res.json({ tenantId: result.tenant_id, sku: result.sku });
  } catch (error) {
    return next(error);
  }
});

app.get('/api/v1/tenant/:tenantId/canvas', async (req, res, next) => {
  try {
    const { tenantId } = req.params;
    assertSafeId(tenantId, 'tenantId');
    const canvas = await storage.readTenantJson(tenantId, 'canvas_pages.json');
    if (!canvas) {
      return res.status(404).json({ error: 'Canvas not found' });
    }

    validateCanvasDocument(canvas);
    const profile = await storage.readTenantJson(tenantId, 'profile.json', {});
    return res.json({ tenantId, profile, canvas });
  } catch (error) {
    return next(error);
  }
});

app.post(
  '/api/v1/tenant/:tenantId/canvas/blocks',
  requireRoles('super-admin', 'creator-admin', 'collaborator'),
  requireTenantAccess,
  async (req, res, next) => {
    try {
      const { tenantId } = req.params;
      assertSafeId(tenantId, 'tenantId');
      const { pageId, block } = req.body || {};
      if (typeof pageId !== 'string' || !block || typeof block !== 'object') {
        return res.status(400).json({ error: 'pageId and block payload are required' });
      }

      const updated = await storage.updateTenantJson(
        tenantId,
        'canvas_pages.json',
        (doc) => {
          validateCanvasDocument(doc);
          const nextDoc = structuredClone(doc);
          const page = nextDoc.canvas_layouts.find((item) => item.page_id === pageId);
          if (!page) {
            const error = new Error('Page not found');
            error.status = 404;
            throw error;
          }

          page.blocks.push(block);
          return nextDoc;
        }
      );

      return res.status(201).json({ canvas: updated });
    } catch (error) {
      return next(error);
    }
  }
);

app.post('/api/v1/tenant/:tenantId/metrics/event', async (req, res, next) => {
  try {
    const { tenantId } = req.params;
    assertSafeId(tenantId, 'tenantId');
    validateAnalyticsEvent(req.body);

    const event = {
      event_id: `evt_${Date.now()}_${Math.floor(Math.random() * 100000)}`,
      timestamp: Math.floor(Date.now() / 1000),
      interaction_type: req.body.interaction_type,
      context_metadata: {
        ...req.body.context_metadata,
        source_ip_hash: `ip_${Buffer.from(String(req.ip || 'unknown')).toString('base64url')}`
      }
    };

    const result = await storage.updateTenantJson(
      tenantId,
      'analytics_logs.json',
      (current) => {
        const list = Array.isArray(current.events) ? current.events : [];
        return {
          $schema_version: current.$schema_version || '1.0.0',
          tenant_id: tenantId,
          events: [...list, event].slice(-5000)
        };
      },
      { $schema_version: '1.0.0', tenant_id: tenantId, events: [] }
    );

    return res.status(201).json({ accepted: true, totalEvents: result.events.length });
  } catch (error) {
    return next(error);
  }
});

app.get(
  '/api/v1/admin/tenants/diagnostics',
  adminLimiter,
  requireRoles('super-admin'),
  async (_req, res, next) => {
    try {
      const tenantRoot = path.join(DATA_ROOT, 'tenants');
      const entries = await fs.readdir(tenantRoot, { withFileTypes: true });
      const tenantFolders = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);

      let totalBytes = 0;
      for (const tenantId of tenantFolders) {
        const files = await fs.readdir(path.join(tenantRoot, tenantId));
        for (const file of files) {
          const stat = await fs.stat(path.join(tenantRoot, tenantId, file));
          totalBytes += stat.size;
        }
      }

      return res.json({
        tenantCount: tenantFolders.length,
        tenantFolders,
        diskUsageBytes: totalBytes,
        dataRoot: tenantRoot
      });
    } catch (error) {
      return next(error);
    }
  }
);

app.post(
  '/api/v1/admin/tenants/:tenantId/entitlements',
  adminLimiter,
  requireRoles('super-admin'),
  async (req, res, next) => {
    try {
      const { tenantId } = req.params;
      assertSafeId(tenantId, 'tenantId');
      const { entitlements } = req.body || {};
      validateEntitlements(entitlements);

      const settings = await storage.updateTenantJson(tenantId, 'settings.json', (current) => ({
        ...current,
        entitlements: {
          ...entitlements
        },
        last_migration_applied: current.last_migration_applied || 'baseline-1'
      }));

      return res.json({ settings });
    } catch (error) {
      return next(error);
    }
  }
);

app.use((error, _req, res, _next) => {
  const status = Number(error.status || 500);
  const message = status >= 500 ? 'Internal server error' : error.message;
  if (status >= 500) {
    console.error(error);
  }
  res.status(status).json({ error: message });
});

app.listen(PORT, () => {
  console.log(`SALTEDHASH Creator backend listening on http://localhost:${PORT}`);
});
