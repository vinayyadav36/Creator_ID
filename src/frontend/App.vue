<template>
  <main class="app-shell">
    <header class="topbar">
      <div>
        <h1>SALTEDHASH Creator Engine</h1>
        <p>SKU: {{ manifest?.sku || 'aurajam' }}</p>
      </div>
      <form class="slug-form" @submit.prevent="loadBySlug">
        <input v-model="slug" placeholder="Enter creator slug" required />
        <button type="submit">Load</button>
      </form>
    </header>

    <section v-if="error" class="error-box">{{ error }}</section>

    <section v-if="canvasData" class="canvas-wrapper">
      <CanvasRenderer
        :blocks="activeBlocks"
        :tokens="canvasData.profile?.branding_tokens || {}"
        @track="trackEvent"
      />
    </section>
  </main>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import CanvasRenderer from './components/CanvasRenderer.vue';

const slug = ref('alexjordan');
const error = ref('');
const tenantId = ref('');
const canvasData = ref(null);
const manifest = ref(null);

const activeBlocks = computed(() => {
  const layouts = canvasData.value?.canvas?.canvas_layouts || [];
  return layouts.find((layout) => layout.is_active)?.blocks || [];
});

async function loadManifest() {
  const response = await fetch('/api/v1/core/manifest?sku=aurajam');
  if (!response.ok) {
    throw new Error('Unable to load manifest');
  }
  const payload = await response.json();
  manifest.value = payload.manifest;
}

async function loadBySlug() {
  error.value = '';
  try {
    const resolveResponse = await fetch(`/api/v1/tenant/resolve?slug=${encodeURIComponent(slug.value)}`);
    if (!resolveResponse.ok) {
      throw new Error('Slug was not found');
    }

    const resolved = await resolveResponse.json();
    tenantId.value = resolved.tenantId;

    const canvasResponse = await fetch(`/api/v1/tenant/${encodeURIComponent(tenantId.value)}/canvas`);
    if (!canvasResponse.ok) {
      throw new Error('Failed to load tenant canvas');
    }

    canvasData.value = await canvasResponse.json();
  } catch (requestError) {
    error.value = requestError.message;
  }
}

async function trackEvent(payload) {
  if (!tenantId.value) {
    return;
  }

  await fetch(`/api/v1/tenant/${encodeURIComponent(tenantId.value)}/metrics/event`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

onMounted(async () => {
  try {
    await loadManifest();
    await loadBySlug();
  } catch (mountError) {
    error.value = mountError.message;
  }
});
</script>
