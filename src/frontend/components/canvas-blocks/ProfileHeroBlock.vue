<template>
  <section class="card hero">
    <img
      v-if="payload.avatar_image_path"
      :src="payload.avatar_image_path"
      :alt="`${payload.display_name || 'Creator'} avatar`"
      class="avatar"
    />
    <h2>{{ payload.display_name || 'Creator' }}</h2>
    <p>{{ payload.tagline || 'Welcome to my creator page.' }}</p>
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
