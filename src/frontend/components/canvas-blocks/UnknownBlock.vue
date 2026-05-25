<template>
  <section class="card unknown-block">
    <p>Unsupported block type: {{ block.type }}</p>
  </section>
</template>

<script setup>
defineProps({
  block: {
    type: Object,
    required: true
  }
});
</script>
