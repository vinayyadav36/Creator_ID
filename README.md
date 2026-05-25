# SALTEDHASH Creator Identity / Publishing Blueprint

## 1. Theme Summary
### Definition
The Creator Identity / Publishing Theme within the SALTEDHASH ecosystem is an edge-native, block-driven, schema-first digital publishing engine. It abstracts personal branding, portfolio management, micro-content publishing, and rapid landing page creation into a unified platform. It allows a solo founder to deploy multiple user-facing micro-SaaS web properties using a single shared core codebase.

### Core Value Proposition
This theme addresses three central problems across creator verticals:

- **Presentation Fragmentation:** Replace disjointed, slow site-builders with clean, JSON-defined layouts optimized for high performance.
- **Monolithic Content Control:** Uncouple raw creator assets from restrictive, platform-specific templates so information remains portable.
- **Infrastructure Overhead:** Bypass expensive cloud databases by using localized, tenant-isolated JSON storage for very low hosting costs.

### Alignment with SALTEDHASH
This architecture aligns with SALTEDHASH’s thesis: fast, security-focused, zero-dependency software assets. Running core processing locally or with low-overhead edge execution removes database maintenance cost and enables a single developer to run scalable micro-SaaS products.

---

## 2. Covered Product Types

```text
                       SALTEDHASH CREATOR ENGINE
                                  │
         ┌────────────────────────┼────────────────────────┐
         ▼                        ▼                        ▼
     AURAJAM                  BLINK PAGE              VIBE RESUME
(Social Link Aggregator)   (Rapid Landers)      (Interactive Portfolios)
         │                        │                        │
         └────────────────────────┴────────────────────────┘
                                  │
                                  ▼
                             FLASHFOCUS
                      (Micro-Blog Snippets)
```

### Identity & Aggregation Layers
- **Aurajam:** Multimedia social link aggregator with mood-based theme switching and stream integrations.
- **Vibe Resume:** Interactive rich-media CV engine with project context blocks and export paths.

### Rapid Publishing & Layout Systems
- **Blink Page:** Minimal, high-speed landing page builder for lead capture and events.
- **FlashFocus:** Chronological micro-blog/snippet engine with markdown-first flow.

### Future Footprints
- **BioKit:** Profile kits for artists, freelancers, and indie developers.
- **BrandSync:** Creator/corporate media hubs with logos, metrics, and verification assets.

---

## 3. Shared Problem Framework
- **Layout Disconnection:** Enforce strict separation between content schemas and presentation layers.
- **Performance and Asset Bloat:** Render lightweight JSON blocks with utility-first styles.
- **Siloed Analytics and Tracking:** Localized anonymous analytics endpoint layer, no external pixels required.
- **Workflow Leakage and Data Loss:** Unified JSON structure for profile, portfolio, and publishing assets.

---

## 4. Core User Types
- **super-admin:** SALTEDHASH global operator; controls app registry, flags, defaults, diagnostics.
- **creator-admin:** Tenant owner; controls profile, slugs, themes, layouts, publishing visibility.
- **collaborator:** Content editor; manages drafts, block payloads, media metadata.
- **public-visitor:** Public consumer; views pages, clicks links, generates anonymized metrics events.

---

## 5. SALTEDHASH Product Strategy
- Use one monorepo engine (`@saltedhash/creator-core`) with SKU-based runtime configuration.
- Resolve product behavior through hostname and/or `process.env.PRODUCT_SKU`.
- Isolate each tenant to `/data/tenants/[tenant_id]/` for local-first multi-tenancy.

---

## 6. Architecture Style
Adopt a **modular monolith**:
- No cross-module mutation.
- In-process event bus / typed module contracts.
- File-scoped storage interfaces with schema validation boundaries.

---

## 7. Global System Structure
```text
+-----------------------------------------------------------------------+
|                            VUE 3 FRONTEND                             |
|  +--------------------+  +--------------------+  +-----------------+  |
|  |   Creator Admin    |  | Dynamic Canvas CSS |  | Shared UI Core  |  |
|  +---------+----------+  +---------+----------+  +--------+--------+  |
+------------│-----------------------│----------------------│-----------+
             ▼                       ▼                      ▼
+-----------------------------------------------------------------------+
|                           EXPRESS BACKEND                             |
|  +--------------------+  +--------------------+  +-----------------+  |
|  | Dynamic API Router |  | Core Event Hub     |  | JSON Schema Val |  |
|  +---------+----------+  +---------+----------+  +--------+--------+  |
+------------│----------------------------------------------│-----------+
             ▼                                              ▼
+-----------------------------------------------------------------------+
|                         FILE STORAGE INTERFACE                        |
|  +--------------------+  +--------------------+  +-----------------+  |
|  | /global/system.json|  | /slugs/registry.json| | /tenants/[id]/ |  |
|  +--------------------+  +--------------------+  +-----------------+  |
+-----------------------------------------------------------------------+
```

---

## 8. Core Reusable Modules
Required shared modules:
- user identity/profile
- public page builder
- theme/template engine
- post/snippet publishing
- media metadata layer
- mood/vibe tagging
- link blocks
- testimonials/projects
- personal brand settings
- sharing/export logic
- page analytics
- custom URL/slug registry
- creator admin dashboard

Each module must expose stable interfaces, use schema validation, and persist to tenant/global JSON files only.

---

## 9. NoSQL / JSON Data Architecture
```text
/data/
├── global/
│   ├── app_registry.json
│   └── slug_master.json
└── tenants/
    └── ten_<id>/
        ├── profile.json
        ├── canvas_pages.json
        ├── content_feed.json
        ├── analytics_logs.json
        └── settings.json
```

Atomic write rule (write temp + rename) is mandatory for all write operations.
All JSON documents carry `$schema_version` and `last_migration_applied` metadata.

---

## 10. Authentication and Authorization
- Local auth only (no external auth providers).
- Password hashing via Node `crypto.scrypt` with per-user salts.
- JWT-based session tokens.
- RBAC middleware enforcing role and permission claims at route boundaries.

---

## 11. Publishing and Template Engine
Render pipeline:
1. Resolve slug to tenant.
2. Load page canvas + theme tokens.
3. Convert theme settings to CSS variables.
4. Render block array to component tree.

Content, presentation, and publishing logic remain fully decoupled.

---

## 12. Content Model System
Block-driven schema model (e.g. `profile_hero`, `link_action`, `media_gallery`, `rich_snippet`).
Pages are ordered arrays of reusable blocks with typed payloads.

---

## 13. Folder Structure
```text
saltedhash-creator-monorepo/
├── data/
│   ├── global/
│   └── tenants/
├── src/
│   ├── backend/
│   │   ├── middleware/
│   │   ├── modules/
│   │   └── server.js
│   ├── frontend/
│   │   ├── assets/
│   │   ├── components/
│   │   │   └── canvas-blocks/
│   │   ├── views/
│   │   └── main.js
│   └── shared/
│       └── schemas/
├── package.json
└── vite.config.js
```

---

## 14. API Design
Namespaces:
- `/api/v1/core/*`
- `/api/v1/tenant/*`
- `/api/v1/admin/*`

Examples:
- `GET /api/v1/core/health`
- `GET /api/v1/core/manifest?sku=aurajam`
- `GET /api/v1/tenant/resolve?slug=alex`
- `GET /api/v1/tenant/:tenantId/canvas`
- `POST /api/v1/tenant/:tenantId/canvas/blocks`
- `POST /api/v1/tenant/:tenantId/metrics/event`
- `GET /api/v1/admin/tenants/diagnostics`
- `POST /api/v1/admin/tenants/:tenantId/entitlements`

---

## 15. Frontend Architecture
Vue 3 + Vite dynamic renderer:
- `CanvasRenderer` maps block `type` to Vue component.
- Theme tokens applied via CSS custom properties.
- Missing theme values gracefully fallback to defaults.

---

## 16. Admin and Brand Management System
Single super-admin console supports:
- Global app activation and SKU config toggles.
- Tenant entitlement and module-flag management.
- File-system diagnostics (folder count, disk usage, path health).
- Registry updates in `app_registry.json` and slug governance controls.

---

## 17. Data Models with Sample JSON
### User Model (`/data/tenants/[id]/settings.json`)
```json
{
  "$schema_version": "1.0.0",
  "tenant_id": "ten_aurajam_001",
  "auth_profile": {
    "account_email": "creator@aurajam.io",
    "security_hash": "scrypt$64$16$1$8f2a...$3c9b...",
    "account_role": "creator-admin"
  },
  "entitlements": {
    "assigned_sku": "aurajam",
    "subscription_tier": "premium",
    "modules_enabled": ["identity", "public_page_builder", "page_analytics", "custom_url_slug"]
  }
}
```

### Tenant Profile (`/data/tenants/[id]/profile.json`)
```json
{
  "$schema_version": "1.0.0",
  "tenant_id": "ten_aurajam_001",
  "routing": {
    "primary_slug": "alexjordan",
    "custom_root_domain": "alexjordan.design"
  },
  "branding_tokens": {
    "chosen_theme_id": "vibe_dark_minimal",
    "bg_color": "#0d0f12",
    "text_color": "#f3f4f6",
    "font_stack": "Inter, system-ui, sans-serif"
  },
  "vibe_context": {
    "active_mood_label": "Deep Focus",
    "status_message": "Building things with minimalist tech architecture stacks.",
    "ambient_audio_url": ""
  }
}
```

### Canvas Layout (`/data/tenants/[id]/canvas_pages.json`)
```json
{
  "$schema_version": "1.2.0",
  "tenant_id": "ten_aurajam_001",
  "canvas_layouts": [
    {
      "page_id": "page_root_index",
      "is_active": true,
      "seo_metadata": {
        "title": "Alex Jordan | Design Hub",
        "description": "Personal product design portfolio hub."
      },
      "blocks": [
        {
          "id": "blk_hero_991",
          "type": "profile_hero",
          "payload": {
            "display_name": "Alex Jordan",
            "avatar_image_path": "/media/ten_aurajam_001/avatar.jpg",
            "tagline": "Product Strategist & Monolith Architect"
          }
        },
        {
          "id": "blk_link_223",
          "type": "link_action",
          "payload": {
            "button_label": "Read Technical Blog",
            "target_url": "https://alexjordan.design",
            "display_icon_marker": "newsletter-icon"
          }
        }
      ]
    }
  ]
}
```

### Analytics Event (`/data/tenants/[id]/analytics_logs.json`)
```json
{
  "event_id": "evt_7721_99128",
  "timestamp": 1782392405,
  "interaction_type": "link_click",
  "context_metadata": {
    "target_element_id": "blk_link_223",
    "anonymized_network_hash": "b3f2...21a",
    "detected_browser_agent": "Mozilla/5.0 (...)"
  }
}
```

---

## 18. MVP Scope
- Shared core engine: local auth, reusable block renderer, tenant JSON storage driver.
- First SKU launch: **Aurajam**.
- Theme presets: light, dark, high-contrast minimal.
- Basic local analytics event logging.

---

## 19. Expansion Strategy
To launch new SKUs without core rewrites:
1. Register SKU in `app_registry.json`.
2. Add product-specific blocks/components.
3. Map product router/layout configuration.

Targets: Blink Page (forms), Vibe Resume (timeline), FlashFocus (markdown feed).

---

## 20. Risks and Guardrails
- **Concurrent write conflicts:** enforce atomic write-and-rename.
- **Core divergence:** keep business logic shared; product differences live in config/components.
- **Analytics file growth:** stream read logs and rotate files after size thresholds.

---

## 21. Final Recommendation
Build one shared multi-tenant monolith with runtime SKU skins.
Execution sequence:
1. Build shared core (security, storage, rendering).
2. Launch Aurajam as first revenue SKU.
3. Extend with Blink Page, Vibe Resume, FlashFocus as modular additions.

This approach maximizes reuse and minimizes infra cost for solo-founder execution.

---

## Development Context Instruction Execution Mandate
- Analyze architecture context before code generation.
- Keep content structures, presentation themes, and local storage paths uncoupled.
- Generate production-ready scripts only (no TODO/placeholders).

### Phase 1: Shared Core Engine Setup
- Scaffold workspace per folder map.
- Implement `src/backend/server.js` with file-stream-safe JSON read/write and atomic rename writes.
- Implement `crypto.scrypt` local verification.
- Route dynamically by tenant/slug without hardcoded domains.

### Phase 2: Interface Generation Blueprint
- Implement Vue 3 views that map block payloads to typed components.
- Ensure styling falls back to defaults when theme keys are absent.
- Proceed with workspace scaffolding using the modular contracts above.
