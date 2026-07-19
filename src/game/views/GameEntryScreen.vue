<template>
  <section class="entry-shell" aria-label="游戏入口页">
    <div class="entry-stage" :class="{ 'entry-stage-updates': isViewingUpdates }">
      <div class="entry-illustration" aria-hidden="true">
        <div class="illustration-backdrop"></div>
        <img class="entry-illustration-image" :src="illustration" alt="" />
        <div class="entry-vignette"></div>
      </div>

      <div class="entry-overlay" :class="{ 'entry-overlay-updates': isViewingUpdates }">
        <div class="entry-centerpiece" :class="{ 'entry-centerpiece-compact': isSelectingSave || isViewingUpdates, 'entry-centerpiece-updates': isViewingUpdates }">
          <h1 class="entry-title">{{ title }}</h1>

          <div
            v-if="!isSelectingSave && !isViewingUpdates"
            ref="entryMenuRef"
            class="entry-menu"
            role="navigation"
            aria-label="开始菜单"
            tabindex="0"
            @keydown="handleMenuKeydown"
          >
            <button
              class="entry-menu-button entry-menu-button-primary"
              :class="{ 'entry-menu-button-selected': selectedMenuKey === 'start' }"
              type="button"
              @mouseenter="selectMenuItem('start')"
              @focus="selectMenuItem('start')"
              @click="startJourney"
            >
              <span class="entry-menu-label">新的旅程</span>
            </button>
            <button
              class="entry-menu-button entry-menu-button-secondary"
              :class="{ 'entry-menu-button-selected': selectedMenuKey === 'continue' }"
              type="button"
              :disabled="saves.length === 0"
              @mouseenter="selectMenuItem('continue')"
              @focus="selectMenuItem('continue')"
              @click="continueJourney"
            >
              <span class="entry-menu-label">继续旅程</span>
            </button>
            <button
              class="entry-menu-button entry-menu-button-secondary"
              :class="{ 'entry-menu-button-selected': selectedMenuKey === 'updates' }"
              type="button"
              @mouseenter="selectMenuItem('updates')"
              @focus="selectMenuItem('updates')"
              @click="openUpdateRecords"
            >
              <span class="entry-menu-label">更新记录</span>
            </button>
          </div>

          <section v-else-if="isSelectingSave" class="entry-save-panel" aria-label="选择存档">
            <header class="entry-save-header">
              <div>
                <span class="entry-save-eyebrow">继续旅程</span>
                <h2 class="entry-save-title">选择一段存档</h2>
              </div>
              <button class="entry-save-back" type="button" @click="closeSaveSelector">
                返回
              </button>
            </header>

            <SaveSlotList
              :saves="saves"
              mode="load"
              aria-label="可继续的存档"
              empty-text="还没有可以继续的本机暂存。"
              @load-game="emit('select-save', $event)"
            />
          </section>

          <UpdateRecordsPanel
            v-else
            :records="updateRecords"
            @close="closeUpdateRecords"
          />
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { updateRecords } from '../data/global/updateRecords.js';
import SaveSlotList from './components/base/SaveSlotList.vue';
import UpdateRecordsPanel from './components/base/UpdateRecordsPanel.vue';

const props = defineProps({
  illustration: {
    type: String,
    required: true
  },
  title: {
    type: String,
    default: '璃落的冒险'
  },
  saves: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['start', 'select-save']);

const entryMenuRef = ref(null);
const isSelectingSave = ref(false);
const isViewingUpdates = ref(false);
const selectedMenuKey = ref('start');

const hasSaves = computed(() => props.saves.length > 0);

const focusEntryMenu = () => {
  nextTick(() => {
    entryMenuRef.value?.focus();
  });
};

const selectMenuItem = (key) => {
  if (key === 'continue' && !hasSaves.value) {
    return;
  }

  selectedMenuKey.value = key;
};

const selectDefaultMenuItem = () => {
  selectedMenuKey.value = hasSaves.value ? 'continue' : 'start';
};

const moveMenuSelection = (direction) => {
  const menuKeys = hasSaves.value ? ['start', 'continue', 'updates'] : ['start', 'updates'];
  const currentIndex = Math.max(menuKeys.indexOf(selectedMenuKey.value), 0);
  const nextIndex = (currentIndex + direction + menuKeys.length) % menuKeys.length;
  selectedMenuKey.value = menuKeys[nextIndex];
};

const startJourney = () => {
  selectedMenuKey.value = 'start';
  emit('start');
};

const openSaveSelector = () => {
  isSelectingSave.value = true;
};
const openUpdateRecords = () => {
  selectedMenuKey.value = 'updates';
  isViewingUpdates.value = true;
};

const closeUpdateRecords = () => {
  isViewingUpdates.value = false;
  selectedMenuKey.value = 'updates';
  focusEntryMenu();
};

const closeSaveSelector = () => {
  isSelectingSave.value = false;
  selectDefaultMenuItem();
  focusEntryMenu();
};

const continueJourney = () => {
  if (!hasSaves.value) {
    selectedMenuKey.value = 'start';
    return;
  }

  selectedMenuKey.value = 'continue';
  openSaveSelector();
};

const activateSelectedMenuItem = () => {
  if (selectedMenuKey.value === 'updates') {
    openUpdateRecords();
    return;
  }

  if (selectedMenuKey.value === 'continue' && hasSaves.value) {
    continueJourney();
    return;
  }

  startJourney();
};

const handleMenuKeydown = (event) => {
  if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
    event.preventDefault();
    moveMenuSelection(event.key === 'ArrowDown' ? 1 : -1);
    return;
  }

  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    activateSelectedMenuItem();
  }
};

watch(hasSaves, () => {
  selectDefaultMenuItem();
}, { immediate: true });

onMounted(() => {
  focusEntryMenu();
});
</script>

<style scoped>
.entry-shell {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.entry-stage {
  position: relative;
  width: min(96vw, calc(96vh * 20 / 9));
  aspect-ratio: 20 / 9;
  overflow: hidden;
  border: 2px solid rgba(238, 172, 229, 0.55);
  box-shadow:
    0 24px 54px rgba(0, 0, 0, 0.45),
    inset 0 0 0 1px rgba(255, 228, 251, 0.1);
  background: #c89bb1;
}

.entry-stage-updates {
  width: 100vw;
  height: 100vh;
  aspect-ratio: auto;
  border: 0;
  box-shadow: none;
}

.entry-illustration,
.entry-overlay,
.illustration-backdrop,
.entry-vignette {
  position: absolute;
  inset: 0;
}

.entry-illustration {
  background:
    linear-gradient(180deg, rgba(255, 241, 247, 0.12) 0%, rgba(61, 26, 55, 0.26) 100%),
    #c89bb1;
}

.illustration-backdrop {
  background:
    radial-gradient(circle at center, rgba(255, 249, 252, 0.12), transparent 48%),
    linear-gradient(90deg, rgba(200, 155, 177, 0.96) 0%, rgba(205, 161, 182, 0.98) 50%, rgba(200, 155, 177, 0.96) 100%);
}

.entry-illustration-image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center;
  display: block;
}

.entry-vignette {
  background:
    linear-gradient(90deg, rgba(62, 28, 53, 0.42) 0%, rgba(62, 28, 53, 0.12) 14%, rgba(62, 28, 53, 0.06) 50%, rgba(62, 28, 53, 0.12) 86%, rgba(62, 28, 53, 0.42) 100%),
    linear-gradient(180deg, rgba(29, 11, 27, 0.56) 0%, rgba(29, 11, 27, 0.12) 22%, rgba(29, 11, 27, 0.08) 66%, rgba(29, 11, 27, 0.62) 100%);
  pointer-events: none;
}

.entry-overlay {
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: clamp(22px, 3vw, 42px);
  box-sizing: border-box;
}

.entry-overlay-updates {
  padding: clamp(8px, 1.5vw, 20px);
}

.entry-centerpiece {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: clamp(42px, 5vw, 72px);
  width: min(70vw, 720px);
}

.entry-centerpiece-compact {
  align-items: stretch;
  justify-content: flex-start;
  gap: 18px;
  width: 100%;
  height: 100%;
  min-height: 0;
}


.entry-centerpiece-updates {
  width: 100%;
  height: 100%;
  gap: 0;
}

.entry-centerpiece-updates .entry-title {
  display: none;
}

.entry-title {
  margin: 0;
  color: #fff5fb;
  font-size: clamp(40px, 5vw, 78px);
  font-weight: 400;
  letter-spacing: 0.16em;
  line-height: 1.08;
  text-indent: 0;
  text-align: center;
  text-shadow:
    0 4px 16px rgba(0, 0, 0, 0.38),
    0 0 26px rgba(255, 214, 239, 0.22);
}

.entry-menu {
  position: relative;
  width: fit-content;
  min-width: clamp(128px, 13vw, 156px);
  margin-top: clamp(10px, 1.8vw, 24px);
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: 6px 0;
  box-sizing: border-box;
  border: 6px solid rgba(142, 42, 124, 0.97);
  border-radius: 8px;
  background:
    linear-gradient(180deg, rgba(176, 72, 154, 0.3), rgba(92, 30, 84, 0.26)),
    rgba(132, 48, 118, 0.16);
  box-shadow:
    0 1px 2px rgba(24, 6, 26, 0.22),
    0 0 14px rgba(142, 42, 124, 0.34),
    0 8px 18px rgba(56, 18, 52, 0.2),
    inset 0 0 10px rgba(190, 82, 166, 0.15);
  backdrop-filter: blur(2px);
}

.entry-menu::before,
.entry-menu::after {
  display: none;
}

.entry-menu:focus {
  outline: none;
}

.entry-save-back {
  border: 2px solid rgba(255, 245, 251, 0.98);
  background:
    linear-gradient(180deg, rgba(186, 88, 163, 0.2), rgba(118, 48, 106, 0.28));
  color: #fffafc;
  cursor: pointer;
  backdrop-filter: blur(8px);
}

.entry-menu-button {
  position: relative;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  min-height: clamp(34px, 3.2vw, 40px);
  padding: 5px 14px 5px 32px;
  border: none;
  background: transparent;
  color: #fffafc;
  cursor: pointer;
  transition:
    background 0.16s ease,
    color 0.16s ease;
  text-align: left;
}

.entry-menu-button:hover,
.entry-menu-button:focus-visible,
.entry-menu-button-selected {
  background: rgba(255, 238, 250, 0.09);
  color: #ffffff;
  outline: none;
}

.entry-menu-button-selected {
  box-shadow:
    0 0 12px rgba(255, 244, 251, 0.16);
}

.entry-menu-button-selected::after {
  content: '';
  position: absolute;
  inset: 0 4px;
  border: 1px solid rgba(236, 194, 250, 0.88);
  box-shadow:
    0 0 8px rgba(205, 137, 235, 0.52),
    inset 0 0 8px rgba(219, 160, 244, 0.34);
  pointer-events: none;
  animation: entry-selected-edge 1.7s ease-in-out infinite;
}

.entry-menu-button::before {
  content: '';
  position: absolute;
  left: 11px;
  top: 50%;
  width: 0;
  height: 0;
  border-top: 5px solid transparent;
  border-bottom: 5px solid transparent;
  border-left: 8px solid rgba(255, 244, 251, 0);
  transform: translateY(-50%);
}

.entry-menu-button:hover::before,
.entry-menu-button:focus-visible::before,
.entry-menu-button-selected::before {
  border-left-color: rgba(255, 244, 251, 0.98);
}

.entry-save-back:hover,
.entry-save-back:focus-visible {
  transform: translateY(-1px);
  background: rgba(134, 78, 149, 0.66);
  box-shadow:
    inset 4px 0 0 rgba(255, 214, 245, 0.76),
    inset 0 0 0 1px rgba(255, 241, 250, 0.08);
  outline: none;
}

.entry-save-back:hover,
.entry-save-back:focus-visible {
  border-color: rgba(255, 250, 253, 1);
}

.entry-menu-button:disabled {
  opacity: 0.46;
  cursor: not-allowed;
  transform: none;
}

.entry-menu-button:disabled:hover,
.entry-menu-button:disabled:focus-visible,
.entry-menu-button:disabled.entry-menu-button-selected {
  background: transparent;
}

.entry-menu-button:disabled.entry-menu-button-selected::after {
  display: none;
}

.entry-menu-label {
  font-size: clamp(15px, 1.05vw, 18px);
  line-height: 1.1;
  letter-spacing: 0.08em;
  text-shadow:
    1px 2px 0 rgba(12, 5, 17, 0.7),
    0 0 8px rgba(0, 0, 0, 0.32),
    0 0 10px rgba(255, 238, 250, 0.12);
  transition: transform 0.16s ease;
}

.entry-menu-button:hover .entry-menu-label,
.entry-menu-button:focus-visible .entry-menu-label,
.entry-menu-button-selected .entry-menu-label {
  transform: translateX(2px);
}

.entry-menu-button:disabled:hover .entry-menu-label,
.entry-menu-button:disabled:focus-visible .entry-menu-label,
.entry-menu-button:disabled.entry-menu-button-selected .entry-menu-label {
  transform: none;
}

@keyframes entry-selected-edge {
  0%,
  100% {
    opacity: 0.62;
    box-shadow:
      0 0 6px rgba(193, 118, 228, 0.4),
      inset 0 0 6px rgba(211, 142, 238, 0.24);
  }

  50% {
    opacity: 0.95;
    box-shadow:
      0 0 14px rgba(216, 151, 242, 0.72),
      inset 0 0 10px rgba(226, 173, 248, 0.42);
  }
}

.entry-save-panel {
  width: 100%;
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: clamp(16px, 2vw, 24px);
  box-sizing: border-box;
  border: 1px solid rgba(255, 232, 248, 0.34);
  background:
    linear-gradient(180deg, rgba(78, 40, 92, 0.86), rgba(57, 27, 68, 0.84));
  backdrop-filter: blur(10px);
  box-shadow:
    0 18px 40px rgba(0, 0, 0, 0.18),
    inset 0 0 0 1px rgba(255, 235, 248, 0.06);
}

.entry-save-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.entry-save-eyebrow,
.entry-save-back {
  color: rgba(255, 230, 247, 0.76);
  font-size: 12px;
}

.entry-save-title {
  margin: 4px 0 0;
  color: #fff5fb;
  font-size: 20px;
  font-weight: 500;
}

.entry-save-back {
  min-width: 76px;
  min-height: 34px;
}

.entry-save-panel :deep(.save-slot-list) {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

@media (max-width: 900px) {
  .entry-overlay {
    padding: 16px;
  }

  .entry-save-panel {
    max-width: none;
    width: 100%;
  }

  .entry-menu {
    min-width: clamp(128px, 36vw, 156px);
  }

  .entry-centerpiece {
    width: min(100%, 420px);
  }

  .entry-centerpiece-compact {
    width: 100%;
  }

  .entry-save-panel :deep(.save-slot-list) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 680px) {
  .entry-stage {
    min-height: 78vh;
    aspect-ratio: auto;
  }

  .entry-overlay {
    padding: 20px;
  }

  .entry-title {
    font-size: clamp(28px, 10vw, 40px);
  }

  .entry-save-panel :deep(.save-slot-list) {
    grid-template-columns: 1fr;
  }
}
</style>
