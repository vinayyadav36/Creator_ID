<template>
  <section class="card">
    <h3>{{ payload.title || 'Snippet' }}</h3>
    <p>{{ payload.body || '' }}</p>
  </section>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  block: {
    type: Object,
    required: true
  }
});

const payload = computed(() => props.block.payload || {});
</script>
