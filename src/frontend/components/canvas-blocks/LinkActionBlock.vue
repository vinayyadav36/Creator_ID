<template>
  <section class="card">
    <a :href="payload.target_url || '#'" target="_blank" rel="noreferrer" @click="emitClick">
      {{ payload.button_label || 'Open Link' }}
    </a>
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

const emit = defineEmits(['track']);
const payload = computed(() => props.block.payload || {});

function emitClick() {
  emit('track', {
    interaction_type: 'link_click',
    context_metadata: {
      target_element_id: props.block.id,
      target_url: payload.value.target_url || ''
    }
  });
}
</script>
