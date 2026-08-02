<template>
  <figure class="responsive-image" :class="{ 'responsive-image--frame': framed }">
    <img
      :src="src"
      :srcset="srcset || undefined"
      :sizes="sizes"
      :alt="asset?.alt || alt"
      :width="asset?.width || undefined"
      :height="asset?.height || undefined"
      :loading="priority ? 'eager' : 'lazy'"
      :fetchpriority="priority ? 'high' : undefined"
      decoding="async"
      @error="hasError = true"
    />
    <div v-if="hasError" class="responsive-image__fallback" role="img" :aria-label="asset?.alt || alt">
      图片暂时无法加载
    </div>
    <figcaption v-if="caption">{{ caption }}</figcaption>
  </figure>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { resolveSiteAsset, resolveSiteSrcset } from '../../content/site/assetRuntime'

const props = defineProps({
  asset: { type: Object, required: true },
  alt: { type: String, default: '' },
  caption: { type: String, default: '' },
  sizes: { type: String, default: '(max-width: 760px) 100vw, 50vw' },
  priority: { type: Boolean, default: false },
  framed: { type: Boolean, default: true },
})

const hasError = ref(false)
const src = computed(() => resolveSiteAsset(props.asset, props.priority ? 'large' : 'content'))
const srcset = computed(() => resolveSiteSrcset(props.asset))

watch(
  () => props.asset?.id,
  () => {
    hasError.value = false
  },
)
</script>

<style scoped>
.responsive-image {
  position: relative;
  margin: 0;
  overflow: hidden;
  background: linear-gradient(135deg, #151b24, #243247);
}

.responsive-image--frame {
  border: 1px solid rgba(245, 240, 231, 0.14);
  border-radius: 8px;
}

.responsive-image img {
  display: block;
  width: 100%;
  height: 100%;
  aspect-ratio: var(--site-image-ratio, auto);
  object-fit: cover;
}

.responsive-image__fallback {
  display: grid;
  min-height: 180px;
  place-items: center;
  color: #f4ece0;
  background:
    radial-gradient(circle at top left, rgba(255, 223, 175, 0.2), transparent 42%),
    repeating-linear-gradient(135deg, rgba(29, 38, 52, 0.9) 0 16px, rgba(22, 28, 38, 0.95) 16px 32px);
}

figcaption {
  padding: 10px 12px 12px;
  color: #cfc5b6;
  font-size: 0.9rem;
  line-height: 1.6;
}
</style>
