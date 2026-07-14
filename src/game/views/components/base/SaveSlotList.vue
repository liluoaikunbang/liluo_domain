<template>
  <div class="save-slot-list" :aria-label="ariaLabel">
    <article
      v-for="save in saves"
      :key="save.slotId"
      class="menu-card save-slot-card"
      :class="`save-slot-card-${mode}`"
    >
      <div class="save-slot-content">
        <span
          class="save-slot-sprite"
          :class="{ 'save-slot-sprite-empty': !save.playerPreview }"
          :style="getSavePreviewStyle(save)"
          aria-hidden="true"
        ></span>
        <div class="save-slot-detail">
          <span class="menu-card-label">{{ save.slotId }}</span>
          <strong class="menu-card-title save-slot-title" :title="formatSaveTitle(save)">
            {{ formatSaveTitle(save) }}
          </strong>
          <p class="menu-card-text save-slot-meta-row">
            <span class="save-slot-status" :title="formatSaveStatus(save)">{{ formatSaveStatus(save) }}</span>
            <span class="save-slot-gold">{{ formatResourceText('金币', save.goldAmount) }}</span>
            <span class="save-slot-desire-crystal">{{ formatResourceText('绮欲结晶', save.desireCrystalAmount) }}</span>
          </p>
          <p class="menu-card-text save-slot-time">{{ formatSaveTime(save.savedAt) }}</p>
        </div>
      </div>

      <div v-if="mode === 'save'" class="save-slot-actions" :class="{ 'save-slot-actions-empty': isAutoSaveSlot(save) }">
        <template v-if="!isAutoSaveSlot(save)">
        <button
          class="save-menu-action"
          type="button"
          :data-menu-nav="true"
          data-menu-group="save-list-actions"
          @click="$emit('save-game', save.slotId)"
        >
          覆盖存档
        </button>
        <button
          class="save-menu-action save-menu-action-danger"
          type="button"
          :data-menu-nav="true"
          data-menu-group="save-list-actions"
          @click="$emit('delete-save', save)"
        >
          删除存档
        </button>
        </template>
      </div>

      <button
        v-else
        class="save-menu-action"
        type="button"
        :data-menu-nav="true"
        data-menu-group="save-list-actions"
        @click="$emit('load-game', save.slotId)"
      >
        读取这个存档
      </button>
    </article>

    <p v-if="saves.length === 0" class="save-menu-empty">{{ emptyText }}</p>
  </div>
</template>

<script setup>
import { AUTO_SAVE_SLOT_ID } from '../../../core/saveStorage';
import { defaultPlayerStatusLabel, resolvePlayerStatusLabels } from '../../../data/playerStatus';
import { getMapRegistryEntry } from '../../../data/registry';

defineProps({
  saves: {
    type: Array,
    default: () => []
  },
  mode: {
    type: String,
    default: 'load',
    validator: (value) => ['save', 'load'].includes(value)
  },
  ariaLabel: {
    type: String,
    default: '可读存档'
  },
  emptyText: {
    type: String,
    default: '还没有可以读取的本机暂存。'
  }
});

defineEmits(['load-game', 'save-game', 'delete-save']);

const isAutoSaveSlot = (save) => save?.slotId === AUTO_SAVE_SLOT_ID;

const formatSaveTitle = (save) => {
  const mapName = save.mapId ? getMapRegistryEntry(save.mapId)?.name : '';

  return mapName || '存档信息不完整';
};

const formatSaveStatus = (save) => {
  const status = resolvePlayerStatusLabels(save.playerStatus ?? []);

  return `状态：${status.length > 0 ? status.join(' / ') : defaultPlayerStatusLabel}`;
};

const formatGoldAmount = (goldAmount) => {
  const normalizedGoldAmount = typeof goldAmount === 'number' ? goldAmount : Number(goldAmount);

  return new Intl.NumberFormat('zh-CN').format(Number.isFinite(normalizedGoldAmount) ? Math.max(0, Math.floor(normalizedGoldAmount)) : 0);
};

const formatResourceText = (label, amount) => `${label}：${formatGoldAmount(amount)}`;

const formatSaveTime = (savedAt) => {
  if (!savedAt) {
    return '保存时间未知';
  }

  return new Intl.DateTimeFormat('zh-CN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(savedAt));
};

const getSavePreviewStyle = (save) => {
  const preview = save.playerPreview;

  if (!preview) {
    return {};
  }

  const column = preview.frameIndex % preview.frameColumns;
  const row = Math.floor(preview.frameIndex / preview.frameColumns);
  const hasAnchoredPlacement = Number.isFinite(preview.displayOriginX)
    && Number.isFinite(preview.displayOriginY)
    && Number.isFinite(preview.displayScale);
  const displayScale = hasAnchoredPlacement ? preview.displayScale : 1.25;
  const left = hasAnchoredPlacement ? 30 - preview.displayOriginX * displayScale : 0;
  const top = hasAnchoredPlacement
    ? (60 - preview.frameHeight * displayScale) / 2
    : 0;

  return {
    '--save-sprite-image': `url("${preview.imageUrl}")`,
    '--save-sprite-width': `${preview.frameWidth}px`,
    '--save-sprite-height': `${preview.frameHeight}px`,
    '--save-sprite-offset-x': `${column * preview.frameWidth}px`,
    '--save-sprite-offset-y': `${row * preview.frameHeight}px`,
    '--save-slot-sprite-left': `${left}px`,
    '--save-slot-sprite-top': `${top}px`,
    '--save-slot-sprite-scale': displayScale
  };
};
</script>

<style scoped>
.save-slot-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  align-content: start;
  align-items: stretch;
  grid-auto-rows: auto;
  overflow-y: auto;
  padding-right: 6px;
  padding-bottom: 6px;
  scrollbar-width: thin;
  scrollbar-color: rgba(232, 142, 224, 0.78) rgba(32, 15, 39, 0.62);
}

.save-slot-list::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

.save-slot-list::-webkit-scrollbar-track {
  border-left: 1px solid rgba(238, 154, 229, 0.14);
  background:
    linear-gradient(180deg, rgba(39, 17, 46, 0.72), rgba(20, 10, 27, 0.72));
}

.save-slot-list::-webkit-scrollbar-thumb {
  min-height: 34px;
  border: 2px solid rgba(30, 13, 37, 0.9);
  border-radius: 8px;
  background:
    linear-gradient(180deg, rgba(242, 163, 235, 0.95), rgba(173, 75, 154, 0.94));
  box-shadow:
    inset 0 1px 0 rgba(255, 232, 252, 0.36),
    0 0 8px rgba(224, 112, 213, 0.2);
}

.save-slot-list::-webkit-scrollbar-thumb:hover {
  background:
    linear-gradient(180deg, rgba(255, 190, 249, 0.98), rgba(198, 92, 178, 0.98));
}

.save-slot-list::-webkit-scrollbar-corner {
  background: rgba(20, 10, 27, 0.72);
}

.menu-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
  min-height: max-content;
  padding: 18px;
  box-sizing: border-box;
  border: 1px solid rgba(239, 194, 233, 0.2);
  background: rgba(88, 45, 102, 0.72);
  overflow-wrap: anywhere;
}

.menu-card-label {
  max-width: 100%;
  color: rgba(255, 225, 244, 0.68);
  font-size: 12px;
  overflow-wrap: anywhere;
}

.menu-card-title {
  max-width: 100%;
  color: #fff4fb;
  font-size: 20px;
  font-weight: 500;
  overflow-wrap: anywhere;
}

.menu-card-text {
  max-width: 100%;
  margin: 0;
  color: rgba(255, 241, 249, 0.82);
  font-size: 14px;
  line-height: 1.7;
  overflow-wrap: anywhere;
}

.save-slot-card {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  min-height: 184px;
  padding: 16px 16px 20px;
  overflow: hidden;
}

.save-slot-card-load {
  justify-content: flex-start;
}

.save-slot-content {
  display: grid;
  grid-template-columns: 60px minmax(0, 1fr);
  gap: 10px;
  align-items: start;
  min-width: 0;
  max-width: 100%;
  min-height: 0;
}

.save-slot-detail {
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 0;
}

.save-slot-title {
  display: block;
  min-width: 0;
  font-size: 16px;
  line-height: 1.35;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.save-slot-sprite {
  position: relative;
  width: 60px;
  height: 60px;
  border: none;
  overflow: hidden;
}

.save-slot-sprite::before {
  content: '';
  position: absolute;
  left: var(--save-slot-sprite-left, 0);
  top: var(--save-slot-sprite-top, 0);
  width: var(--save-sprite-width, 48px);
  height: var(--save-sprite-height, 48px);
  background-color: transparent;
  background-image: var(--save-sprite-image);
  background-repeat: no-repeat;
  background-size: auto;
  background-position:
    calc(var(--save-sprite-offset-x) * -1)
    calc(var(--save-sprite-offset-y) * -1);
  image-rendering: pixelated;
  transform: scale(var(--save-slot-sprite-scale));
  transform-origin: top left;
}

.save-slot-sprite-empty {
  background-image: none;
}

.save-slot-sprite-empty::before {
  background-image: none;
}

.save-slot-meta-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  column-gap: 14px;
  row-gap: 3px;
  min-width: 0;
}

.save-slot-status {
  min-width: 0;
  flex: 1 1 100%;
  line-height: 1.45;
  overflow: visible;
  overflow-wrap: anywhere;
}

.save-slot-gold,
.save-slot-desire-crystal {
  flex: 0 1 auto;
  min-width: 0;
  white-space: normal;
  overflow-wrap: anywhere;
}

.save-slot-time {
  color: rgba(255, 225, 244, 0.68);
  font-size: 12px;
  line-height: 1.45;
}

.save-menu-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  max-width: 100%;
  min-height: 36px;
  padding: 7px 12px;
  border: 1px solid rgba(255, 224, 247, 0.28);
  background: rgba(105, 53, 122, 0.78);
  color: #fff6fc;
  font-size: 14px;
  line-height: 1.35;
  text-align: center;
  white-space: normal;
  overflow-wrap: anywhere;
  cursor: pointer;
}

.save-menu-action-danger {
  border-color: rgba(255, 184, 194, 0.34);
  background: rgba(116, 49, 70, 0.78);
}

.save-menu-action-danger:hover,
.save-menu-action-danger:focus-visible {
  border-color: rgba(255, 219, 225, 0.56);
  background: rgba(146, 63, 88, 0.92);
}

.save-menu-action:hover,
.save-menu-action:focus-visible {
  border-color: rgba(255, 233, 250, 0.5);
  background: rgba(134, 78, 149, 0.9);
  outline: none;
}

.save-slot-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  width: 100%;
  min-height: 36px;
  margin-top: auto;
  padding-top: 22px;
  padding-bottom: 4px;
}

.save-slot-actions-empty {
  visibility: hidden;
  pointer-events: none;
}

.save-slot-actions > .save-menu-action {
  width: 100%;
}

.save-menu-empty {
  margin: 0;
  color: rgba(255, 241, 249, 0.72);
  font-size: 14px;
}

@media (max-width: 900px) {
  .save-slot-list {
    grid-template-columns: 1fr;
  }
}
</style>
