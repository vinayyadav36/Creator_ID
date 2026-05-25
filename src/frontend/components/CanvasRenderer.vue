<template>
  <article class="canvas" :style="themeStyle">
    <component
      :is="resolveBlock(block.type)"
      v-for="block in blocks"
      :key="block.id"
      :block="block"
      @track="$emit('track', $event)"
    />
  </article>
</template>

<script setup>
import { computed } from 'vue';
import LinkActionBlock from './canvas-blocks/LinkActionBlock.vue';
import ProfileHeroBlock from './canvas-blocks/ProfileHeroBlock.vue';
import RichSnippetBlock from './canvas-blocks/RichSnippetBlock.vue';
import UnknownBlock from './canvas-blocks/UnknownBlock.vue';

const props = defineProps({
  blocks: {
    type: Array,
    default: () => []
  },
  tokens: {
    type: Object,
    default: () => ({})
  }
});

defineEmits(['track']);

const defaults = {
  bg_color: '#0d0f12',
  text_color: '#f3f4f6',
  font_stack: 'Inter, system-ui, sans-serif'
};

const themeStyle = computed(() => {
  const merged = { ...defaults, ...props.tokens };
  return {
    '--canvas-bg': merged.bg_color,
    '--canvas-text': merged.text_color,
    '--canvas-font': merged.font_stack
  };
});

function resolveBlock(type) {
  if (type === 'profile_hero') return ProfileHeroBlock;
  if (type === 'link_action') return LinkActionBlock;
  if (type === 'rich_snippet') return RichSnippetBlock;
  return UnknownBlock;
}
</script>
