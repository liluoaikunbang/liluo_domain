<template>
  <header class="section-intro">
    <p v-if="eyebrow" class="section-intro__eyebrow">{{ eyebrow }}</p>
    <h2>{{ title }}</h2>
    <p v-if="body" class="section-intro__body">{{ body }}</p>
  </header>
</template>

<script setup>
defineProps({
  eyebrow: { type: String, default: '' },
  title: { type: String, required: true },
  body: { type: String, default: '' },
})
</script>

<style scoped>
.section-intro {
  display: grid;
  gap: 12px;
  max-width: 760px;
}

.section-intro__eyebrow {
  margin: 0;
  color: #dfb66e;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

h2 {
  margin: 0;
  color: #f4efe6;
  font-size: clamp(2rem, 4vw, 3.7rem);
  line-height: 0.98;
}

.section-intro__body {
  margin: 0;
  color: #aab4c7;
  font-size: 1rem;
  line-height: 1.8;
}
</style>
