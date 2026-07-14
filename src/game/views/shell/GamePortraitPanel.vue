<template>
  <div class="portrait-stage" :aria-label="ariaLabel">
    <div
      v-if="statusIcons.length > 0"
      ref="statusListRef"
      class="portrait-status-list"
      aria-label="拘束状态"
    >
      <span class="portrait-status-list__label" aria-label="拘束状态">
        <span>拘束</span>
        <span>状态</span>
      </span>
      <button
        v-for="statusIcon in statusIcons"
        :key="statusIcon.id"
        type="button"
        class="portrait-status-icon"
        :class="{ 'portrait-status-icon--active': pinnedStatusId === statusIcon.id }"
        :aria-label="statusIcon.label"
        :aria-expanded="pinnedStatusId === statusIcon.id"
        @click.stop="handleStatusClick(statusIcon.id)"
      >
        <img
          class="portrait-status-icon__image"
          :src="statusIcon.iconUrl"
          :alt="statusIcon.label"
        />
        <span
          class="portrait-status-popover"
          role="tooltip"
          :aria-hidden="pinnedStatusId !== statusIcon.id"
          @click.stop
        >
          <span class="portrait-status-popover__title">{{ statusIcon.label }}</span>
          <span class="portrait-status-popover__description">
            {{ statusIcon.description || '该状态正在记录角色当前处境，后续可继续接入地图、事件与剧情反馈。' }}
          </span>
          <span class="portrait-status-popover__function">
            {{ statusIcon.functionInfo }}
          </span>
        </span>
      </button>
    </div>
    <div
      v-if="displayedPortraitLayers.length > 0"
      class="portrait-layer-stack"
      :class="`portrait-layer-stack--${portraitMotionMode}`"
      :aria-label="portraitAlt"
      role="img"
    >
      <span
        v-for="(portraitLayer, portraitLayerIndex) in displayedPortraitLayers"
        :key="portraitLayer.key"
        class="portrait-layer-motion"
        :class="getPortraitLayerMotionClasses(portraitLayer)"
        :style="getPortraitLayerMotionStyle(portraitLayer, portraitLayerIndex)"
        aria-hidden="true"
      >
        <img
          class="portrait-layer-image"
          :src="portraitLayer.src"
          :alt="portraitLayer.alt ?? ''"
        />
      </span>
    </div>
    <img
      v-else-if="portraitSrc"
      class="portrait-image"
      :src="portraitSrc"
      :alt="portraitAlt"
    />
    <span v-else class="portrait-empty">{{ emptyText }}</span>
    <span v-if="previewPortraitLayers.length > 0" class="portrait-back-preview-wrap">
      <button
        class="portrait-back-preview"
        type="button"
        :aria-label="previewPortraitAriaLabel"
        :aria-pressed="isBackPortraitActive"
        @click.stop="toggleBackPortrait"
      >
        <span class="portrait-back-preview__stack">
          <img
            v-for="portraitLayer in previewPortraitLayers"
            :key="portraitLayer.key"
            class="portrait-back-preview__layer"
            :src="portraitLayer.src"
            :alt="portraitLayer.alt ?? ''"
            aria-hidden="true"
          />
        </span>
      </button>
      <span class="portrait-back-preview__label">{{ previewPortraitLabel }}</span>
    </span>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';

const statusListRef = ref(null);
const pinnedStatusId = ref(null);
const isBackPortraitActive = ref(false);

function handleStatusClick(statusId) {
  pinnedStatusId.value = pinnedStatusId.value === statusId ? null : statusId;
}

function handleDocumentDismiss(event) {
  if (!pinnedStatusId.value || statusListRef.value?.contains(event.target)) {
    return;
  }

  pinnedStatusId.value = null;
}

function handleDocumentKeyDown(event) {
  if (event.key === 'Escape') {
    pinnedStatusId.value = null;
  }
}

function toggleBackPortrait() {
  if (props.portraitBackLayers.length === 0) {
    return;
  }

  isBackPortraitActive.value = !isBackPortraitActive.value;
}

onMounted(() => {
  document.addEventListener('click', handleDocumentDismiss, true);
  document.addEventListener('touchstart', handleDocumentDismiss, true);
  document.addEventListener('keydown', handleDocumentKeyDown);
});

onUnmounted(() => {
  document.removeEventListener('click', handleDocumentDismiss, true);
  document.removeEventListener('touchstart', handleDocumentDismiss, true);
  document.removeEventListener('keydown', handleDocumentKeyDown);
});

const props = defineProps({
  portraitSrc: {
    type: String,
    default: ''
  },
  portraitLayers: {
    type: Array,
    default: () => []
  },
  portraitBackLayers: {
    type: Array,
    default: () => []
  },
  portraitAlt: {
    type: String,
    default: '角色立绘'
  },
  emptyText: {
    type: String,
    default: '暂无立绘'
  },
  ariaLabel: {
    type: String,
    default: '角色立绘区域'
  },
  statusIcons: {
    type: Array,
    default: () => []
  },
  portraitMotionMode: {
    type: String,
    default: 'idle'
  }
});

const displayedPortraitLayers = computed(() => {
  return isBackPortraitActive.value ? props.portraitBackLayers : props.portraitLayers;
});

const previewPortraitLayers = computed(() => {
  return isBackPortraitActive.value ? props.portraitLayers : props.portraitBackLayers;
});

const previewPortraitLabel = computed(() => {
  return isBackPortraitActive.value ? '\u524d\u8eab' : '\u540e\u80cc';
});

const previewPortraitAriaLabel = computed(() => {
  return `${props.portraitAlt}${previewPortraitLabel.value}\u9884\u89c8`;
});

function resolveEffectiveMotionPreset(layer) {
  if (layer.motionPreset === 'fixed') {
    return 'fixed';
  }

  if (props.portraitMotionMode === 'boundTight' && layer.motionGroup === 'binding') {
    return 'tightStruggle';
  }

  if (props.portraitMotionMode === 'boundSoft' && layer.motionGroup === 'binding') {
    return 'softStruggle';
  }

  return layer.motionPreset ?? 'idle';
}

function shouldApplyRestlessMotion(layer) {
  if (!['boundSoft', 'boundTight'].includes(props.portraitMotionMode)) {
    return false;
  }

  return ['upperBody', 'upperClothing', 'head', 'hair', 'expression', 'binding'].includes(layer.motionGroup);
}

function getPortraitLayerMotionClasses(layer) {
  const motionGroup = layer.motionGroup ?? 'base';
  const motionPreset = resolveEffectiveMotionPreset(layer);

  return [
    `portrait-layer-motion--group-${motionGroup}`,
    `portrait-layer-motion--motion-${motionPreset}`,
    {
      'portrait-layer-motion--restless': shouldApplyRestlessMotion(layer),
      'portrait-layer-motion--restless-tight': props.portraitMotionMode === 'boundTight' && shouldApplyRestlessMotion(layer)
    }
  ];
}

function getStableLayerMotionDelay(layer, fallbackIndex) {
  const motionKey = (layer.keywords?.length ? layer.keywords : [layer.alt, layer.motionGroup, layer.key])
    .filter(Boolean)
    .join('|');
  let hash = 0;

  for (let index = 0; index < motionKey.length; index += 1) {
    hash = (hash + motionKey.charCodeAt(index) * (index + 1)) % 7;
  }

  return (hash || fallbackIndex % 5) * 90;
}

function getPortraitLayerMotionStyle(layer, index) {
  return {
    '--portrait-layer-delay': `${getStableLayerMotionDelay(layer, index)}ms`,
    zIndex: layer.zIndex ?? index + 1
  };
}

watch(() => props.portraitBackLayers, (backLayers) => {
  if (backLayers.length === 0) {
    isBackPortraitActive.value = false;
  }
});

watch(() => props.portraitLayers, () => {
  isBackPortraitActive.value = false;
});
</script>

<style scoped>
.portrait-stage {
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  min-height: 0;
  overflow: hidden;
  border: 1px solid rgba(232, 151, 224, 0.26);
  background:
    radial-gradient(circle at top, rgba(216, 173, 203, 0.22), rgba(216, 173, 203, 0) 50%),
    linear-gradient(180deg, #705a70 0%, #564558 56%, #403445 100%);
}

.portrait-status-list {
  position: absolute;
  left: 8px;
  top: 8px;
  z-index: 4;
  display: flex;
  max-height: calc(100% - 16px);
  flex-direction: column;
  gap: 5px;
  pointer-events: auto;
}

.portrait-status-list__label {
  display: inline-flex;
  width: 42px;
  min-height: 38px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  color: #ffffff;
  font-size: 15px;
  font-weight: 700;
  line-height: 1.15;
  text-shadow:
    0 2px 0 #7b164d,
    1px 0 0 #7b164d,
    -1px 0 0 #7b164d,
    0 -1px 0 #7b164d;
}

.portrait-status-icon {
  position: relative;
  width: 42px;
  height: 42px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 2px;
  box-sizing: border-box;
  border: 2px solid #a32366;
  border-radius: 4px;
  background: #ffffff;
  box-shadow: 0 2px 0 rgba(47, 18, 38, 0.72);
  cursor: pointer;
  appearance: none;
  font: inherit;
}

.portrait-status-icon:hover,
.portrait-status-icon:focus-visible,
.portrait-status-icon--active {
  border-color: #f4c0e1;
  outline: none;
  box-shadow:
    0 0 0 2px rgba(123, 22, 77, 0.7),
    0 3px 0 rgba(47, 18, 38, 0.72);
}

.portrait-status-icon__image {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: contain;
  image-rendering: auto;
}

.portrait-status-popover {
  position: absolute;
  left: calc(100% + 8px);
  top: -2px;
  z-index: 5;
  width: min(220px, calc(100vw - 92px));
  display: none;
  flex-direction: column;
  gap: 7px;
  box-sizing: border-box;
  padding: 10px 12px 11px;
  border: 2px solid #7b164d;
  border-radius: 6px;
  background: rgba(255, 248, 253, 0.97);
  color: #3b2134;
  text-align: left;
  box-shadow:
    0 3px 0 rgba(47, 18, 38, 0.72),
    0 8px 18px rgba(33, 12, 30, 0.28);
  white-space: normal;
  pointer-events: auto;
}

.portrait-status-icon:hover .portrait-status-popover,
.portrait-status-icon:focus-visible .portrait-status-popover,
.portrait-status-icon--active .portrait-status-popover {
  display: flex;
}

.portrait-status-popover::before {
  position: absolute;
  left: -7px;
  top: 15px;
  width: 10px;
  height: 10px;
  content: '';
  border-left: 2px solid #7b164d;
  border-bottom: 2px solid #7b164d;
  background: rgba(255, 248, 253, 0.97);
  transform: rotate(45deg);
}

.portrait-status-popover__title {
  color: #7b164d;
  font-size: 15px;
  font-weight: 800;
  line-height: 1.15;
}

.portrait-status-popover__description,
.portrait-status-popover__function {
  font-size: 12px;
  line-height: 1.55;
}

.portrait-status-popover__function {
  padding-top: 7px;
  border-top: 1px solid rgba(123, 22, 77, 0.22);
  color: #6f4963;
}

.portrait-layer-stack,
.portrait-image {
  width: 100%;
  height: 100%;
}

.portrait-layer-stack {
  position: relative;
}

.portrait-image,
.portrait-layer-motion,
.portrait-layer-image {
  object-fit: contain;
  object-position: center;
  display: block;
}

.portrait-layer-motion {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  will-change: auto;
}

.portrait-layer-image {
  width: 100%;
  height: 100%;
}

.portrait-layer-motion--motion-idle {
  animation: none;
}

.portrait-layer-motion--motion-idle,
.portrait-layer-motion--motion-hairSway,
.portrait-layer-motion--motion-softStruggle,
.portrait-layer-motion--motion-tightStruggle,
.portrait-layer-motion--restless,
.portrait-layer-motion--restless-tight,
.portrait-layer-motion--group-lowerBody,
.portrait-layer-motion--group-feet,
.portrait-layer-motion--motion-fixed {
  animation: none;
  will-change: auto;
}

.portrait-layer-motion--motion-hairSway {
  animation: none;
}

.portrait-layer-motion--motion-softStruggle {
  animation: none;
}

.portrait-layer-motion--motion-tightStruggle {
  animation: none;
}

.portrait-layer-motion--restless:not(.portrait-layer-motion--motion-softStruggle):not(.portrait-layer-motion--motion-tightStruggle):not(.portrait-layer-motion--motion-fixed) {
  animation: none;
}

.portrait-layer-motion--restless-tight:not(.portrait-layer-motion--motion-softStruggle):not(.portrait-layer-motion--motion-tightStruggle):not(.portrait-layer-motion--motion-fixed) {
  animation: none;
}

.portrait-empty {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  color: rgba(231, 246, 255, 0.7);
  font-size: clamp(12px, 0.9vw, 15px);
  letter-spacing: 0.08em;
  text-align: center;
}

.portrait-back-preview-wrap {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 3;
  width: clamp(46px, 20%, 64px);
  display: flex;
  flex-direction: column;
  gap: 3px;
  align-items: stretch;
}

.portrait-back-preview {
  position: relative;
  display: block;
  width: 100%;
  aspect-ratio: 457 / 1024;
  box-sizing: border-box;
  border: 1px solid rgba(244, 192, 225, 0.58);
  border-radius: 4px;
  background: rgba(39, 22, 44, 0.34);
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.08),
    0 4px 12px rgba(31, 13, 29, 0.22);
  padding: 3px 3px 4px;
  cursor: pointer;
  appearance: none;
}

.portrait-back-preview:hover,
.portrait-back-preview:focus-visible {
  border-color: rgba(255, 234, 248, 0.82);
  background: rgba(68, 35, 76, 0.5);
  outline: none;
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.12),
    0 0 0 2px rgba(123, 22, 77, 0.58),
    0 4px 12px rgba(31, 13, 29, 0.22);
}

.portrait-back-preview__stack {
  position: absolute;
  inset: 3px;
  display: block;
}

.portrait-back-preview__layer {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
  object-fit: contain;
  object-position: center;
}

.portrait-back-preview__label {
  display: block;
  width: 100%;
  color: rgba(255, 246, 252, 0.92);
  font-size: 11px;
  font-weight: 700;
  line-height: 1.15;
  text-align: center;
  text-shadow: 0 1px 2px rgba(31, 13, 29, 0.8);
  white-space: nowrap;
}

@media (prefers-reduced-motion: reduce) {
  .portrait-layer-motion,
  .portrait-layer-motion--motion-idle,
  .portrait-layer-motion--motion-hairSway,
  .portrait-layer-motion--motion-softStruggle,
  .portrait-layer-motion--motion-tightStruggle,
  .portrait-layer-motion--restless,
  .portrait-layer-motion--restless-tight {
    animation: none;
    transform: none;
    will-change: auto;
  }
}
</style>
