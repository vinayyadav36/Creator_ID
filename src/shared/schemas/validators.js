const ALLOWED_BLOCK_TYPES = new Set(['profile_hero', 'link_action', 'rich_snippet']);

function hasSchemaFields(doc) {
  return doc && typeof doc === 'object' && typeof doc.$schema_version === 'string';
}

export function validateCanvasDocument(doc) {
  if (!hasSchemaFields(doc) || !Array.isArray(doc.canvas_layouts)) {
    throw new Error('Invalid canvas document');
  }

  for (const page of doc.canvas_layouts) {
    if (!page || typeof page.page_id !== 'string' || !Array.isArray(page.blocks)) {
      throw new Error('Invalid canvas page');
    }

    for (const block of page.blocks) {
      if (!block || typeof block.id !== 'string' || !ALLOWED_BLOCK_TYPES.has(block.type)) {
        throw new Error('Invalid canvas block');
      }
      if (!block.payload || typeof block.payload !== 'object') {
        throw new Error('Invalid block payload');
      }
    }
  }
}

export function validateAnalyticsEvent(event) {
  if (!event || typeof event !== 'object') {
    throw new Error('Invalid analytics event payload');
  }

  const { interaction_type: interactionType, context_metadata: metadata } = event;
  if (typeof interactionType !== 'string' || interactionType.length > 64) {
    throw new Error('Invalid interaction_type');
  }

  if (!metadata || typeof metadata !== 'object') {
    throw new Error('Invalid context_metadata');
  }
}

export function validateEntitlements(entitlements) {
  if (!entitlements || typeof entitlements !== 'object') {
    throw new Error('Invalid entitlements payload');
  }

  if (typeof entitlements.assigned_sku !== 'string') {
    throw new Error('assigned_sku is required');
  }

  if (!Array.isArray(entitlements.modules_enabled)) {
    throw new Error('modules_enabled must be an array');
  }
}
