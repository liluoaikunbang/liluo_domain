<template>
  <transition name="game-menu-fade">
    <section
      v-if="visible"
      class="game-menu-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="旅途菜单"
    >
      <button
        class="game-menu-backdrop"
        type="button"
        aria-label="关闭菜单遮罩"
        @click="$emit('close')"
      ></button>

      <div class="game-menu-panel">
        <button class="game-menu-close" type="button" aria-label="关闭菜单" @click="$emit('close')">
          ×
        </button>

        <div ref="gameMenuPanelRef" class="game-menu-body" tabindex="-1" @keydown="handleMenuKeydown">
          <nav class="game-menu-sidebar" aria-label="菜单栏目">
            <button
              v-for="item in menuTabs"
              :key="item.key"
              class="game-menu-tab"
              :class="{ 'game-menu-tab-active': item.key === activeTabKey }"
              :data-menu-nav="true"
              data-menu-group="menu-tabs"
              :data-menu-key="item.key"
              type="button"
              @click="activeTabKey = item.key"
            >
              <span class="game-menu-tab-label">{{ item.label }}</span>
            </button>
          </nav>

          <section class="game-menu-content" aria-label="当前栏目内容">
            <CharacterMenuPanel
              v-if="activeTab.key === 'character'"
              :active-player-portrait="activePlayerPortrait"
              :current-player-preview-style="currentPlayerPreviewStyle"
              :current-player-walk-style="currentPlayerWalkStyle"
              :current-player-walk-frame-styles="currentPlayerWalkFrameStyles"
              :current-player-walk-is-hop="currentPlayerWalkIsHop"
              :character-stats="characterStats"
              :player-status-icons="playerStatusIcons"
            />

            <MapMenuPanel
              v-else-if="activeTab.key === 'map'"
              :map-entry="currentMapEntryForMenu"
              :current-map-name="currentMapName"
              :current-position="currentPosition"
              :vision-presentation="currentPlayerVisionPresentation"
            />

            <InventoryMenuPanel
              v-else-if="activeTab.key === 'items'"
              :inventory-categories="inventoryCategories"
              :active-inventory-category="activeInventoryCategory"
              :active-inventory-category-key="activeInventoryCategoryKey"
              :active-inventory-slot="activeInventorySlot"
              :active-inventory-slot-key="activeInventorySlotKey"
              :gold-amount="goldAmount"
              :desire-crystal-amount="desireCrystalAmount"
              :placeholder-item-detail-paragraphs="placeholderItemDetailParagraphs"
              @select-category="selectInventoryCategory"
              @select-slot="activeInventorySlotKey = $event"
            />

            <SkillMenuPanel
              v-else-if="activeTab.key === 'skills'"
              :skill-categories="skillCategories"
              :active-skill-category="activeSkillCategory"
              :active-skill-category-key="activeSkillCategoryKey"
              :active-skill-slot="activeSkillSlot"
              :active-skill-slot-key="activeSkillSlotKey"
              :placeholder-skill-detail-paragraphs="placeholderSkillDetailParagraphs"
              @select-category="selectSkillCategory"
              @select-slot="activeSkillSlotKey = $event"
            />

            <EquipmentMenuPanel
              v-else-if="activeTab.key === 'equipment'"
              :equipment-categories="equipmentCategories"
              :active-equipment-category="activeEquipmentCategory"
              :active-equipment-category-key="activeEquipmentCategoryKey"
              :active-equipment-items="activeEquipmentItems"
              :active-equipment-item="activeEquipmentItem"
              :active-equipment-item-key="activeEquipmentItemKey"
              :placeholder-equipment-detail-paragraphs="placeholderEquipmentDetailParagraphs"
              @select-category="selectEquipmentCategory"
              @select-item="activeEquipmentItemKey = $event"
            />

            <RestraintMenuPanel
              v-else-if="activeTab.key === 'restraints'"
              :restraint-categories="restraintCategories"
              :active-restraint-category="activeRestraintCategory"
              :active-restraint-category-key="activeRestraintCategoryKey"
              :active-restraint-items="activeRestraintItems"
              :active-restraint-item="activeRestraintItem"
              :active-restraint-item-key="activeRestraintItemKey"
              :active-player-portrait="activePlayerPortrait"
              :placeholder-restraint-detail-paragraphs="placeholderRestraintDetailParagraphs"
              @select-category="selectRestraintCategory"
              @select-item="activeRestraintItemKey = $event"
            />

            <QuestMenuPanel
              v-else-if="activeTab.key === 'quests'"
              :quest-sections="questSections"
              :active-quest-branch-key="activeQuestBranchKey"
              :active-quest-task="activeQuestTask"
              :active-quest-task-key="activeQuestTaskKey"
              :placeholder-quest-detail-paragraphs="placeholderQuestDetailParagraphs"
              :count-quest-tasks="countQuestTasks"
              :is-quest-branch-expanded="isQuestBranchExpanded"
              @set-active-branch="activeQuestBranchKey = $event"
              @toggle-branch="toggleQuestBranch"
              @select-task="selectQuestTask"
            />

            <StoryMenuPanel
              v-else-if="activeTab.key === 'story'"
              :outline="storyOutline"
            />

            <CompendiumMenuPanel
              v-else-if="activeTab.key === 'codex'"
              :codex-categories="codexCategories"
              :codex-world-options="codexWorldOptions"
              :active-codex-category="activeCodexCategory"
              :active-codex-category-key="activeCodexCategoryKey"
              :active-codex-slot="activeCodexSlot"
              :active-codex-slot-key="activeCodexSlotKey"
              :placeholder-codex-detail-paragraphs="placeholderCodexDetailParagraphs"
              @select-category="selectCodexCategory"
              @select-slot="activeCodexSlotKey = $event"
            />

            <SaveMenuPanel
              v-else-if="activeTab.key === 'save'"
              :saves="saves"
              :current-player-preview-style="currentPlayerPreviewStyle"
              :current-map-name="currentMapName"
              :current-location-text="currentLocationText"
              :current-player-status-text="currentPlayerStatusText"
              :gold-amount="goldAmount"
              :desire-crystal-amount="desireCrystalAmount"
              @save-game="$emit('save-game', $event)"
              @save-overwrite="confirmOverwriteSave"
              @delete-save="confirmDeleteSave"
              @export-saves="$emit('export-saves')"
              @delete-all-saves="confirmDeleteAllSaves"
            />

            <LoadMenuPanel
              v-else-if="activeTab.key === 'load'"
              :saves="saves"
              @load-game="$emit('load-game', $event)"
              @import-file-change="handleImportFileChange"
            />

            <GameMenuPlaceholderPanel v-else :active-tab="activeTab" />
          </section>
        </div>

        <GameConfirmDialog
          :visible="Boolean(pendingOverwriteSaveSlotId)"
          label="覆盖存档"
          title="要覆盖这段旅程吗？"
          :message="overwriteConfirmMessage"
          confirm-text="覆盖存档"
          cancel-text="先保留"
          @confirm="handleOverwriteSaveConfirm"
          @cancel="clearPendingOverwriteSave"
        />

        <GameConfirmDialog
          :visible="Boolean(pendingDeleteSave)"
          label="删除存档"
          title="要抹去这段旅程吗？"
          :message="deleteConfirmMessage"
          confirm-text="删除存档"
          cancel-text="先保留"
          @confirm="handleDeleteSaveConfirm"
          @cancel="clearPendingDeleteSave"
        />

        <GameConfirmDialog
          :visible="pendingDeleteAllSaves"
          label="清空存档"
          title="要清空全部浏览器存档吗？"
          :message="deleteAllConfirmMessage"
          confirm-text="清空全部存档"
          cancel-text="先保留"
          @confirm="handleDeleteAllSavesConfirm"
          @cancel="clearPendingDeleteAllSaves"
        />

        <GameConfirmDialog
          :visible="Boolean(pendingImportFile)"
          label="导入存档"
          title="要覆盖本机存档吗？"
          :message="importConfirmMessage"
          confirm-text="导入并覆盖"
          cancel-text="取消导入"
          @confirm="handleImportFileConfirm"
          @cancel="clearPendingImportFile"
        />
      </div>
    </section>
  </transition>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue';
import './gameMenuOverlay.css';
import { getGameRuntimeState } from '../../../core/gameRuntime';
import {
  getPlayerRuntimeState,
  resolvePlayerRuntimeVisionPresentation,
  resolvePlayerRuntimeCharacterDefinition,
  resolvePlayerRuntimePortrait,
  resolvePlayerRuntimeStatusLabel
} from '../../../core/playerRuntime';
import {
  resolveEquipmentMenuCategories,
  resolveInventoryMenuCategories,
  resolveRestraintMenuCategories
} from '../../../core/gameMenuDataResolver';
import CharacterMenuPanel from './CharacterMenuPanel.vue';
import CompendiumMenuPanel from './CompendiumMenuPanel.vue';
import GameConfirmDialog from './GameConfirmDialog.vue';
import EquipmentMenuPanel from './EquipmentMenuPanel.vue';
import GameMenuPlaceholderPanel from './GameMenuPlaceholderPanel.vue';
import InventoryMenuPanel from './InventoryMenuPanel.vue';
import LoadMenuPanel from './LoadMenuPanel.vue';
import MapMenuPanel from './MapMenuPanel.vue';
import QuestMenuPanel from './QuestMenuPanel.vue';
import RestraintMenuPanel from './RestraintMenuPanel.vue';
import SaveMenuPanel from './SaveMenuPanel.vue';
import SkillMenuPanel from './SkillMenuPanel.vue';
import StoryMenuPanel from './StoryMenuPanel.vue';
import {
  codexCategories,
  codexWorldOptions,
  equipmentCategories as equipmentCategoryDefinitions,
  inventoryCategories as inventoryCategoryDefinitions,
  menuTabs,
  placeholderCodexDetailParagraphs,
  placeholderEquipmentDetailParagraphs,
  placeholderItemDetailParagraphs,
  placeholderQuestDetailParagraphs,
  placeholderRestraintDetailParagraphs,
  placeholderSkillDetailParagraphs,
  questSections,
  restraintCategories as restraintCategoryDefinitions,
  skillCategories
} from '../../../data/global/gameMenuData';
import { storyOutline } from '../../../data/story_outline/storyOutline';
import { resolvePlayerStatusDefinitions } from '../../../data/playerStatus';
import { getMapRegistryEntry } from '../../../data/registry';
import {
  getPlayerCharacterFrameTextureKey,
  playerCharacterUiPreviewHeight,
  resolvePlayerCharacterStaticPreview,
  resolvePlayerCharacterUiPreviewScale
} from '../../../data/playerCharacter';
import {
  getLayeredCharacterTextureAnchor,
  getLayeredCharacterTexturePreviewUrl,
  resolveAnchoredCharacterFramePlacement,
  resolveCharacterTextureDisplayOrigin
} from '../../../systems/animation/character/layeredCharacterTexture';
import { formatResourceText, resolvePlaceholderDetailParagraphs } from './gameMenuHelpers';

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  saves: {
    type: Array,
    default: () => []
  },
  currentMapName: {
    type: String,
    default: ''
  },
  currentMapId: {
    type: String,
    default: ''
  },
  currentMapEntry: {
    type: Object,
    default: null
  },
  currentPosition: {
    type: Object,
    default: null
  },
  currentPlayerPortrait: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['close', 'save-game', 'load-game', 'delete-save', 'delete-all-saves', 'export-saves', 'import-saves']);

const gameMenuPanelRef = ref(null);
const pendingOverwriteSaveSlotId = ref('');
const pendingDeleteSave = ref(null);
const pendingDeleteAllSaves = ref(false);
const pendingImportFile = ref(null);

const activeTabKey = ref(menuTabs[0].key);
const activeInventoryCategoryKey = ref('');
const activeInventorySlotKey = ref('');
const activeSkillCategoryKey = ref('');
const activeSkillSlotKey = ref('');
const activeEquipmentCategoryKey = ref('');
const activeEquipmentItemKey = ref('');
const activeRestraintCategoryKey = ref('');
const activeRestraintItemKey = ref('');
const activeCodexCategoryKey = ref(codexCategories[0]?.key ?? '');
const activeCodexSlotKey = ref(codexCategories[0]?.slots[0]?.key ?? '');
const expandedQuestBranchKeys = ref([]);
const activeQuestBranchKey = ref('');
const activeQuestTaskKey = ref('');

const playerRuntimeState = getPlayerRuntimeState();
const inventoryCategories = computed(() => resolveInventoryMenuCategories(
  inventoryCategoryDefinitions,
  playerRuntimeState.inventory
));
const equipmentCategories = computed(() => resolveEquipmentMenuCategories(
  equipmentCategoryDefinitions,
  playerRuntimeState.equipment
));
const restraintCategories = computed(() => resolveRestraintMenuCategories(
  restraintCategoryDefinitions,
  playerRuntimeState.restraints
));
const activeTab = computed(
  () => menuTabs.find((item) => item.key === activeTabKey.value) ?? menuTabs[0]
);
const activeInventoryCategory = computed(
  () => inventoryCategories.value.find((item) => item.key === activeInventoryCategoryKey.value) ?? null
);
const activeSkillCategory = computed(
  () => skillCategories.find((item) => item.key === activeSkillCategoryKey.value) ?? null
);
const activeEquipmentCategory = computed(
  () => equipmentCategories.value.find((item) => item.key === activeEquipmentCategoryKey.value) ?? null
);
const activeRestraintCategory = computed(
  () => restraintCategories.value.find((item) => item.key === activeRestraintCategoryKey.value) ?? null
);
const activeInventorySlot = computed(
  () => activeInventoryCategory.value?.slots.find((slot) => slot.key === activeInventorySlotKey.value) ?? null
);
const activeSkillSlot = computed(
  () => activeSkillCategory.value?.slots.find((slot) => slot.key === activeSkillSlotKey.value) ?? null
);
const activeEquipmentItems = computed(() => activeEquipmentCategory.value?.items ?? []);
const activeEquipmentItem = computed(
  () => activeEquipmentItems.value.find((item) => item.key === activeEquipmentItemKey.value) ?? null
);
const activeRestraintItems = computed(() => activeRestraintCategory.value?.items ?? []);
const activeRestraintItem = computed(
  () => activeRestraintItems.value.find((item) => item.key === activeRestraintItemKey.value) ?? null
);
const activeCodexCategory = computed(
  () => codexCategories.find((item) => item.key === activeCodexCategoryKey.value) ?? null
);
const activeCodexSlot = computed(
  () => activeCodexCategory.value?.slots.find((slot) => slot.key === activeCodexSlotKey.value) ?? null
);
const flattenedQuestTasks = computed(() => {
  return questSections.flatMap((section) => {
    const sectionTasks = section.tasks ?? [];
    const groupedTasks = (section.groups ?? []).flatMap((group) => group.tasks ?? []);

    return [...sectionTasks, ...groupedTasks];
  });
});
const activeQuestTask = computed(
  () => flattenedQuestTasks.value.find((task) => task.key === activeQuestTaskKey.value) ?? null
);

const navigationKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
const gridNavigationColumns = {
  'item-slots': 2,
  'skill-slots': 2,
  'equipment-items': 1,
  'equipment-actions': 2,
  'restraint-items': 1,
  'restraint-actions': 2,
  'character-stats': 1,
  'map-overview': 1,
  'quest-tree-items': 1,
  'codex-slots': 2,
  'placeholder-cards': 2
};

function getNavigationElements(group) {
  const panel = gameMenuPanelRef.value;

  if (!panel) {
    return [];
  }

  return Array.from(panel.querySelectorAll('[data-menu-nav]')).filter((element) => {
    return element.dataset.menuGroup === group && !element.disabled && element.getAttribute('aria-hidden') !== 'true';
  });
}

function focusNavigationElement(group, index = 0) {
  const elements = getNavigationElements(group);

  if (elements.length === 0) {
    return false;
  }

  const normalizedIndex = Math.max(0, Math.min(index, elements.length - 1));
  elements[normalizedIndex].focus();
  return true;
}

function focusNavigationElementByKey(group, key) {
  const elements = getNavigationElements(group);
  const targetIndex = elements.findIndex((element) => element.dataset.menuKey === key);

  return focusNavigationElement(group, targetIndex >= 0 ? targetIndex : 0);
}

function focusActiveMenuTab() {
  return focusNavigationElementByKey('menu-tabs', activeTabKey.value);
}

function focusActiveContentControl() {
  if (activeTabKey.value === 'character') {
    return focusNavigationElement('character-stats');
  }

  if (activeTabKey.value === 'map') {
    return focusNavigationElement('map-overview');
  }

  if (activeTabKey.value === 'items') {
    return activeInventoryCategoryKey.value
      ? focusNavigationElementByKey('item-categories', activeInventoryCategoryKey.value)
      : focusNavigationElement('item-categories');
  }

  if (activeTabKey.value === 'skills') {
    return activeSkillCategoryKey.value
      ? focusNavigationElementByKey('skill-categories', activeSkillCategoryKey.value)
      : focusNavigationElement('skill-categories');
  }

  if (activeTabKey.value === 'equipment') {
    return activeEquipmentCategoryKey.value
      ? focusNavigationElementByKey('equipment-categories', activeEquipmentCategoryKey.value)
      : focusNavigationElement('equipment-categories');
  }

  if (activeTabKey.value === 'restraints') {
    return activeRestraintCategoryKey.value
      ? focusNavigationElementByKey('restraint-categories', activeRestraintCategoryKey.value)
      : focusNavigationElement('restraint-categories');
  }

  if (activeTabKey.value === 'quests') {
    return activeQuestTaskKey.value
      ? focusNavigationElementByKey('quest-tree-items', activeQuestTaskKey.value)
      : focusNavigationElementByKey('quest-tree-items', activeQuestBranchKey.value) ||
        focusNavigationElement('quest-tree-items');
  }

  if (activeTabKey.value === 'codex') {
    return activeCodexCategoryKey.value
      ? focusNavigationElementByKey('codex-categories', activeCodexCategoryKey.value)
      : focusNavigationElement('codex-categories');
  }

  if (activeTabKey.value === 'save') {
    return focusNavigationElement('save-primary-action') ||
      focusNavigationElement('save-list-actions') ||
      focusNavigationElement('save-footer-actions');
  }

  if (activeTabKey.value === 'load') {
    return focusNavigationElement('save-list-actions') ||
      focusNavigationElement('load-footer-actions');
  }

  return focusNavigationElement('placeholder-cards');
}

function moveMenuTab(offset) {
  const activeIndex = menuTabs.findIndex((item) => item.key === activeTabKey.value);
  const nextIndex = (activeIndex + offset + menuTabs.length) % menuTabs.length;
  activeTabKey.value = menuTabs[nextIndex].key;
  nextTick(focusActiveMenuTab);
}

function moveCategoryFocus(categories, currentElement, group, offset) {
  const currentKey = currentElement.dataset.menuKey;
  const activeIndex = categories.findIndex((category) => category.key === currentKey);
  const nextIndex = activeIndex + offset;

  if (nextIndex < 0 || nextIndex >= categories.length) {
    return false;
  }

  const nextCategory = categories[nextIndex];
  nextTick(() => focusNavigationElementByKey(group, nextCategory.key));
  return true;
}

function moveLinearGroup(group, currentElement, offset) {
  const elements = getNavigationElements(group);
  const currentIndex = elements.indexOf(currentElement);

  if (currentIndex < 0) {
    return false;
  }

  const nextIndex = currentIndex + offset;

  if (nextIndex < 0 || nextIndex >= elements.length) {
    return false;
  }

  return focusNavigationElement(group, nextIndex);
}

function moveGridGroup(group, currentElement, eventKey) {
  const elements = getNavigationElements(group);
  const currentIndex = elements.indexOf(currentElement);
  const columnCount = gridNavigationColumns[group] ?? 1;

  if (currentIndex < 0) {
    return false;
  }

  const rowIndex = Math.floor(currentIndex / columnCount);
  const columnIndex = currentIndex % columnCount;
  let nextIndex = currentIndex;

  if (eventKey === 'ArrowLeft') {
    nextIndex = currentIndex - 1;
  } else if (eventKey === 'ArrowRight') {
    nextIndex = currentIndex + 1;
  } else if (eventKey === 'ArrowUp') {
    nextIndex = currentIndex - columnCount;
  } else if (eventKey === 'ArrowDown') {
    nextIndex = currentIndex + columnCount;
  }

  if (nextIndex < 0 || nextIndex >= elements.length) {
    return false;
  }

  if ((eventKey === 'ArrowLeft' || eventKey === 'ArrowRight') && Math.floor(nextIndex / columnCount) !== rowIndex) {
    return false;
  }

  if ((eventKey === 'ArrowUp' || eventKey === 'ArrowDown') && nextIndex % columnCount !== columnIndex) {
    return false;
  }

  return focusNavigationElement(group, nextIndex);
}

function handleCategoryKeydown(event, currentElement, categories, setActiveCategoryKey, group, slotGroup) {
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    const hasMoved = moveCategoryFocus(categories, currentElement, group, event.key === 'ArrowRight' ? 1 : -1);

    if (!hasMoved && event.key === 'ArrowLeft') {
      clearActiveCategoryByGroup(group);
      focusActiveMenuTab();
    }

    return;
  }

  if (event.key === 'ArrowUp') {
    clearActiveCategoryByGroup(group);
    focusActiveMenuTab();
    return;
  }

  if (event.key === 'ArrowDown') {
    setActiveCategoryKey(currentElement.dataset.menuKey);
    nextTick(() => focusNavigationElement(slotGroup));
    return;
  }

  if (event.key === 'Enter' || event.key === ' ') {
    currentElement.click();
  }
}

function clearActiveInventorySlot() {
  activeInventorySlotKey.value = '';
}

function clearActiveSkillSlot() {
  activeSkillSlotKey.value = '';
}

function clearActiveEquipmentItem() {
  activeEquipmentItemKey.value = '';
}

function clearActiveRestraintItem() {
  activeRestraintItemKey.value = '';
}

function clearActiveCodexSlot() {
  activeCodexSlotKey.value = '';
}

function selectInventoryCategory(key) {
  activeInventoryCategoryKey.value = key;
  clearActiveInventorySlot();
}

function selectSkillCategory(key) {
  activeSkillCategoryKey.value = key;
  clearActiveSkillSlot();
}

function selectEquipmentCategory(key) {
  if (activeEquipmentCategoryKey.value === key) {
    return;
  }

  activeEquipmentCategoryKey.value = key;
  activeEquipmentItemKey.value = equipmentCategories.value.find((category) => category.key === key)?.items[0]?.key ?? '';
}

function selectRestraintCategory(key) {
  if (activeRestraintCategoryKey.value === key) {
    return;
  }

  activeRestraintCategoryKey.value = key;
  activeRestraintItemKey.value = restraintCategories.value.find((category) => category.key === key)?.items[0]?.key ?? '';
}

function selectCodexCategory(key) {
  if (activeCodexCategoryKey.value === key) {
    return;
  }

  activeCodexCategoryKey.value = key;
  activeCodexSlotKey.value = codexCategories.find((category) => category.key === key)?.slots[0]?.key ?? '';
}

function findQuestBranchKeyByTask(taskKey) {
  for (const section of questSections) {
    if (section.tasks?.some((task) => task.key === taskKey)) {
      return section.key;
    }

    const group = section.groups?.find((item) => item.tasks?.some((task) => task.key === taskKey));

    if (group) {
      return group.key;
    }
  }

  return '';
}

function countQuestTasks(branch) {
  const directCount = branch.tasks?.length ?? 0;
  const nestedCount = (branch.groups ?? []).reduce((count, group) => count + countQuestTasks(group), 0);

  return directCount + nestedCount;
}

function isQuestBranchExpanded(key) {
  return expandedQuestBranchKeys.value.includes(key);
}

function toggleQuestBranch(key) {
  activeQuestBranchKey.value = key;
  const isExpanded = isQuestBranchExpanded(key);
  expandedQuestBranchKeys.value = isExpanded
    ? expandedQuestBranchKeys.value.filter((item) => item !== key)
    : [...expandedQuestBranchKeys.value, key];
}

function selectQuestTask(key) {
  activeQuestTaskKey.value = key;
  activeQuestBranchKey.value = findQuestBranchKeyByTask(key) || activeQuestBranchKey.value;
}

function selectFocusedEquipmentCategory(currentElement) {
  const key = currentElement.dataset.menuKey;

  if (!key) {
    return false;
  }

  selectEquipmentCategory(key);
  return true;
}

function clearActiveContentSlot() {
  clearActiveInventorySlot();
  clearActiveSkillSlot();
  clearActiveEquipmentItem();
  clearActiveRestraintItem();
  clearActiveCodexSlot();
}

function clearActiveInventoryCategory() {
  activeInventoryCategoryKey.value = '';
  clearActiveInventorySlot();
}

function clearActiveSkillCategory() {
  activeSkillCategoryKey.value = '';
  clearActiveSkillSlot();
}

function clearActiveEquipmentCategory() {
  activeEquipmentCategoryKey.value = '';
  clearActiveEquipmentItem();
}

function clearActiveRestraintCategory() {
  activeRestraintCategoryKey.value = '';
  clearActiveRestraintItem();
}

function clearActiveQuestState() {
  expandedQuestBranchKeys.value = [];
  activeQuestBranchKey.value = '';
  activeQuestTaskKey.value = '';
}

function resetActiveCodexState() {
  activeCodexCategoryKey.value = codexCategories[0]?.key ?? '';
  activeCodexSlotKey.value = codexCategories[0]?.slots[0]?.key ?? '';
}

function clearAllContentCategory() {
  clearActiveInventoryCategory();
  clearActiveSkillCategory();
  clearActiveEquipmentCategory();
  clearActiveRestraintCategory();
  resetActiveCodexState();
  clearActiveQuestState();
}

function clearActiveCategoryByGroup(group) {
  if (group === 'item-categories') {
    clearActiveInventoryCategory();
  } else if (group === 'skill-categories') {
    clearActiveSkillCategory();
  } else if (group === 'equipment-categories') {
    clearActiveEquipmentCategory();
  } else if (group === 'restraint-categories') {
    clearActiveRestraintCategory();
  } else if (group === 'codex-categories') {
    resetActiveCodexState();
  }
}

function handleSlotKeydown(event, currentElement, group, categoryGroup, activeCategoryKey) {
  if (moveGridGroup(group, currentElement, event.key)) {
    return;
  }

  if (group === 'equipment-items' && event.key === 'ArrowDown') {
    focusNavigationElement('equipment-actions');
    return;
  }

  if (group === 'restraint-items' && event.key === 'ArrowDown') {
    focusNavigationElement('restraint-actions');
    return;
  }

  if (group === 'equipment-items' && event.key === 'ArrowRight') {
    focusNavigationElement('equipment-actions');
    return;
  }

  if (group === 'restraint-items' && event.key === 'ArrowRight') {
    focusNavigationElement('restraint-actions');
    return;
  }

  if (event.key === 'ArrowUp') {
    focusNavigationElementByKey(categoryGroup, activeCategoryKey);
    return;
  }

  if (event.key === 'ArrowLeft') {
    focusActiveMenuTab();
  }
}

function selectFocusedRestraintCategory(currentElement) {
  const key = currentElement.dataset.menuKey;

  if (!key) {
    return false;
  }

  selectRestraintCategory(key);
  return true;
}

function handleEquipmentCategoryKeydown(event, currentElement) {
  if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
    moveCategoryFocus(
      equipmentCategories.value,
      currentElement,
      'equipment-categories',
      event.key === 'ArrowDown' ? 1 : -1
    );
    return;
  }

  if (event.key === 'ArrowLeft') {
    focusActiveMenuTab();
    return;
  }

  if (event.key === 'ArrowRight' || event.key === 'Enter' || event.key === ' ') {
    if (selectFocusedEquipmentCategory(currentElement)) {
      nextTick(() => focusNavigationElement('equipment-items'));
    }
  }
}

function handleEquipmentItemKeydown(event, currentElement) {
  if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
    moveLinearGroup('equipment-items', currentElement, event.key === 'ArrowDown' ? 1 : -1);
    return;
  }

  if (event.key === 'ArrowLeft') {
    focusNavigationElementByKey('equipment-categories', activeEquipmentCategoryKey.value) ||
      focusNavigationElement('equipment-categories');
    return;
  }

  if (event.key === 'ArrowRight') {
    focusNavigationElement('equipment-actions');
    return;
  }

  if (event.key === 'Enter' || event.key === ' ') {
    currentElement.click();
  }
}

function handleEquipmentActionKeydown(event, currentElement) {
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    moveLinearGroup('equipment-actions', currentElement, event.key === 'ArrowRight' ? 1 : -1);
    return;
  }

  if (event.key === 'ArrowUp') {
    focusNavigationElementByKey('equipment-items', activeEquipmentItemKey.value) ||
      focusNavigationElement('equipment-items');
    return;
  }

  if (event.key === 'ArrowDown') {
    return;
  }

  if (event.key === 'Enter' || event.key === ' ') {
    currentElement.click();
  }
}

function handleRestraintCategoryKeydown(event, currentElement) {
  if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
    moveCategoryFocus(
      restraintCategories.value,
      currentElement,
      'restraint-categories',
      event.key === 'ArrowDown' ? 1 : -1
    );
    return;
  }

  if (event.key === 'ArrowLeft') {
    focusActiveMenuTab();
    return;
  }

  if (event.key === 'ArrowRight' || event.key === 'Enter' || event.key === ' ') {
    if (selectFocusedRestraintCategory(currentElement)) {
      nextTick(() => focusNavigationElement('restraint-items'));
    }
  }
}

function handleRestraintItemKeydown(event, currentElement) {
  if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
    moveLinearGroup('restraint-items', currentElement, event.key === 'ArrowDown' ? 1 : -1);
    return;
  }

  if (event.key === 'ArrowLeft') {
    focusNavigationElementByKey('restraint-categories', activeRestraintCategoryKey.value) ||
      focusNavigationElement('restraint-categories');
    return;
  }

  if (event.key === 'ArrowRight') {
    focusNavigationElement('restraint-actions');
    return;
  }

  if (event.key === 'Enter' || event.key === ' ') {
    currentElement.click();
  }
}

function handleRestraintActionKeydown(event, currentElement) {
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    moveLinearGroup('restraint-actions', currentElement, event.key === 'ArrowRight' ? 1 : -1);
    return;
  }

  if (event.key === 'ArrowUp') {
    focusNavigationElementByKey('restraint-items', activeRestraintItemKey.value) ||
      focusNavigationElement('restraint-items');
    return;
  }

  if (event.key === 'ArrowDown') {
    return;
  }

  if (event.key === 'Enter' || event.key === ' ') {
    currentElement.click();
  }
}

function handleQuestBranchKeydown(event, currentElement) {
  if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
    moveLinearGroup('quest-tree-items', currentElement, event.key === 'ArrowDown' ? 1 : -1);
    return;
  }

  if (event.key === 'ArrowLeft') {
    if (isQuestBranchExpanded(currentElement.dataset.menuKey)) {
      toggleQuestBranch(currentElement.dataset.menuKey);
      return;
    }

    focusActiveMenuTab();
    return;
  }

  if (event.key === 'ArrowRight') {
    if (!isQuestBranchExpanded(currentElement.dataset.menuKey)) {
      toggleQuestBranch(currentElement.dataset.menuKey);
    }

    return;
  }

  if (event.key === 'Enter' || event.key === ' ') {
    currentElement.click();
  }
}

function handleQuestTaskKeydown(event, currentElement) {
  if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
    moveLinearGroup('quest-tree-items', currentElement, event.key === 'ArrowDown' ? 1 : -1);
    return;
  }

  if (event.key === 'ArrowLeft') {
    focusNavigationElementByKey('quest-tree-items', activeQuestBranchKey.value) || focusActiveMenuTab();
    return;
  }

  if (event.key === 'Enter' || event.key === ' ') {
    currentElement.click();
  }
}

function handleMenuKeydown(event) {
  if (![...navigationKeys, 'Enter', ' '].includes(event.key)) {
    return;
  }

  if (pendingOverwriteSaveSlotId.value || pendingDeleteSave.value || pendingDeleteAllSaves.value || pendingImportFile.value) {
    return;
  }

  const currentElement = event.target.closest?.('[data-menu-nav]');

  if (!currentElement) {
    if (navigationKeys.includes(event.key)) {
      event.preventDefault();
      focusActiveMenuTab();
    }
    return;
  }

  const group = currentElement.dataset.menuGroup;

  if (!group) {
    return;
  }

  event.preventDefault();

  if (group === 'menu-tabs') {
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      moveMenuTab(event.key === 'ArrowDown' ? 1 : -1);
      return;
    }

    if (event.key === 'ArrowRight') {
      nextTick(focusActiveContentControl);
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      currentElement.click();
    }
    return;
  }

  if (group === 'item-categories') {
    handleCategoryKeydown(
      event,
      currentElement,
      inventoryCategories.value,
      (key) => {
        activeInventoryCategoryKey.value = key;
      },
      'item-categories',
      'item-slots'
    );
    return;
  }

  if (group === 'skill-categories') {
    handleCategoryKeydown(
      event,
      currentElement,
      skillCategories,
      (key) => {
        activeSkillCategoryKey.value = key;
      },
      'skill-categories',
      'skill-slots'
    );
    return;
  }

  if (group === 'equipment-categories') {
    handleEquipmentCategoryKeydown(event, currentElement);
    return;
  }

  if (group === 'restraint-categories') {
    handleRestraintCategoryKeydown(event, currentElement);
    return;
  }

  if (group === 'item-slots') {
    handleSlotKeydown(event, currentElement, 'item-slots', 'item-categories', activeInventoryCategoryKey.value);
    return;
  }

  if (group === 'skill-slots') {
    handleSlotKeydown(event, currentElement, 'skill-slots', 'skill-categories', activeSkillCategoryKey.value);
    return;
  }

  if (group === 'equipment-items') {
    handleEquipmentItemKeydown(event, currentElement);
    return;
  }

  if (group === 'equipment-actions') {
    handleEquipmentActionKeydown(event, currentElement);
    return;
  }

  if (group === 'restraint-items') {
    handleRestraintItemKeydown(event, currentElement);
    return;
  }

  if (group === 'restraint-actions') {
    handleRestraintActionKeydown(event, currentElement);
    return;
  }

  if (group === 'character-stats') {
    if (moveGridGroup(group, currentElement, event.key)) {
      return;
    }

    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      focusActiveMenuTab();
      return;
    }
  }

  if (group === 'map-overview') {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      focusActiveMenuTab();
    }
    return;
  }

  if (group === 'quest-tree-items') {
    if (currentElement.dataset.questKind === 'branch') {
      handleQuestBranchKeydown(event, currentElement);
      return;
    }

    handleQuestTaskKeydown(event, currentElement);
    return;
  }

  if (group === 'codex-categories') {
    handleCategoryKeydown(
      event,
      currentElement,
      codexCategories,
      (key) => {
        activeCodexCategoryKey.value = key;
      },
      'codex-categories',
      'codex-slots'
    );
    return;
  }

  if (group === 'codex-slots') {
    handleSlotKeydown(event, currentElement, 'codex-slots', 'codex-categories', activeCodexCategoryKey.value);
    return;
  }

  if (group === 'save-primary-action') {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      focusActiveMenuTab();
      return;
    }

    if (event.key === 'ArrowDown') {
      focusNavigationElement('save-list-actions') || focusNavigationElement('save-footer-actions');
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      currentElement.click();
    }
    return;
  }

  if (group === 'save-list-actions') {
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      if (moveLinearGroup(group, currentElement, 1)) {
        return;
      }

      focusNavigationElement('save-footer-actions') || focusNavigationElement('load-footer-actions');
      return;
    }

    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      if (moveLinearGroup(group, currentElement, -1)) {
        return;
      }

      if (event.key === 'ArrowLeft') {
        focusActiveMenuTab();
        return;
      }

      if (activeTabKey.value === 'save') {
        focusNavigationElement('save-primary-action');
        return;
      }

      focusActiveMenuTab();
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      currentElement.click();
    }
    return;
  }

  if (group === 'placeholder-cards') {
    if (moveGridGroup(group, currentElement, event.key)) {
      return;
    }

    if (event.key === 'ArrowLeft') {
      focusActiveMenuTab();
      return;
    }

    if (event.key === 'ArrowUp') {
      if (activeTabKey.value === 'save') {
        focusNavigationElement('save-primary-action');
        return;
      }

      focusActiveMenuTab();
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      currentElement.click();
    }
    return;
  }

  if (group === 'save-footer-actions' || group === 'load-footer-actions') {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      const hasMoved = moveLinearGroup(group, currentElement, event.key === 'ArrowRight' ? 1 : -1);

      if (!hasMoved && event.key === 'ArrowLeft') {
        focusActiveMenuTab();
      }

      return;
    }

    if (event.key === 'ArrowUp') {
      if (activeTabKey.value === 'save') {
        focusNavigationElement('save-list-actions') || focusNavigationElement('save-primary-action');
        return;
      }

      focusNavigationElement('save-list-actions') || focusActiveMenuTab();
      return;
    }

    if (event.key === 'ArrowLeft') {
      focusActiveMenuTab();
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      currentElement.click();
    }
  }
}

const gameRuntimeState = getGameRuntimeState();
const goldAmount = computed(() => gameRuntimeState.gold);
const desireCrystalAmount = computed(() => gameRuntimeState.desireCrystals);
const activePlayerPortrait = computed(() => props.currentPlayerPortrait ?? resolvePlayerRuntimePortrait());
const currentPlayerStatusText = computed(() => resolvePlayerRuntimeStatusLabel());
const currentPlayerVisionPresentation = computed(() => resolvePlayerRuntimeVisionPresentation());
const currentMapEntryForMenu = computed(() => props.currentMapEntry ?? getMapRegistryEntry(props.currentMapId));
const playerStatusIcons = computed(() => {
  return resolvePlayerStatusDefinitions(getPlayerRuntimeState().status)
    .filter((status) => status.iconUrl)
    .map((status) => ({
      id: status.id,
      label: status.label,
      iconUrl: status.iconUrl
    }));
});
function resolveSpriteFrameStyle(
  characterDefinition,
  frame,
  frameColumns,
  animationFrameCount,
  animationFrameIndex,
  displayScale,
  targetY
) {
  const frameTextureKey = typeof frame === 'object' ? frame.textureKey : null;
  const layeredFramePreviewUrl = frameTextureKey
    ? getLayeredCharacterTexturePreviewUrl(frameTextureKey)
    : null;
  const frameAsset = frameTextureKey
    ? characterDefinition.textureAssets.find((asset) => asset.key === frameTextureKey)
    : null;
  const frameIndex = typeof frame === 'number' ? frame : 0;
  const frameWidth = characterDefinition.previewAsset.frameWidth;
  const frameHeight = characterDefinition.previewAsset.frameHeight;
  const hasStandaloneFrame = Boolean(layeredFramePreviewUrl || frameAsset);
  const column = hasStandaloneFrame ? 0 : frameIndex % frameColumns;
  const row = hasStandaloneFrame ? 0 : Math.floor(frameIndex / frameColumns);
  const displayOrigin = resolveCharacterTextureDisplayOrigin({
    textureAnchor: frameTextureKey
      ? getLayeredCharacterTextureAnchor(frameTextureKey)
      : null,
    fallbackOrigin: {
      x: frameWidth / 2,
      y: characterDefinition.displayOriginY ?? frameHeight / 2
    },
    configuredDisplayOriginY: characterDefinition.displayOriginY,
    frameHeight
  });
  const placement = resolveAnchoredCharacterFramePlacement({
    displayOrigin,
    scale: displayScale,
    target: { x: 32, y: targetY }
  });

  return {
    '--save-current-sprite-image': `url("${layeredFramePreviewUrl ?? frameAsset?.url ?? characterDefinition.previewAsset.url}")`,
    '--save-current-sprite-width': `${frameWidth}px`,
    '--save-current-sprite-height': `${frameHeight}px`,
    '--save-current-sprite-offset-x': `${column * frameWidth}px`,
    '--save-current-sprite-offset-y': `${row * frameHeight}px`,
    '--character-walk-frame-left': `${placement.left}px`,
    '--character-walk-frame-top': `${placement.top}px`,
    '--character-walk-frame-scale': placement.scale,
    '--character-walk-frame-count': animationFrameCount,
    '--character-walk-frame-index': animationFrameIndex,
    '--character-walk-frame-delay': `${0.72 / animationFrameCount * animationFrameIndex}s`,
    '--character-walk-frame-opacity': animationFrameCount > 1 ? 0 : 1,
    '--character-walk-frame-animation': animationFrameCount > 1
      ? 'character-walk-frame-cycle 0.72s steps(1, end) infinite'
      : 'none'
  };
}

const currentPlayerPreviewStyle = computed(() => {
  const characterDefinition = resolvePlayerRuntimeCharacterDefinition();
  const preview = resolvePlayerCharacterStaticPreview(characterDefinition.appearanceId);

  if (!preview) {
    return {};
  }

  const column = preview.frameIndex % preview.frameColumns;
  const row = Math.floor(preview.frameIndex / preview.frameColumns);
  const placement = resolveAnchoredCharacterFramePlacement({
    displayOrigin: {
      x: preview.displayOriginX,
      y: preview.displayOriginY
    },
    scale: preview.displayScale,
    target: {
      x: 30,
      y: (60 - playerCharacterUiPreviewHeight) / 2
        + preview.displayOriginY * preview.displayScale
    }
  });

  return {
    '--save-current-sprite-image': `url("${preview.imageUrl}")`,
    '--save-current-sprite-width': `${preview.frameWidth}px`,
    '--save-current-sprite-height': `${preview.frameHeight}px`,
    '--save-current-sprite-offset-x': `${column * preview.frameWidth}px`,
    '--save-current-sprite-offset-y': `${row * preview.frameHeight}px`,
    '--save-current-sprite-left': `${placement.left}px`,
    '--save-current-sprite-top': `${placement.top}px`,
    '--save-current-sprite-scale': placement.scale
  };
});
const currentPlayerWalkFrames = computed(() => {
  const characterDefinition = resolvePlayerRuntimeCharacterDefinition();
  const walkAnimation = characterDefinition.animationBundle.find(
    (animation) => animation.key === characterDefinition.getAnimationKey('walk', 'down')
  );

  return walkAnimation?.frames?.length ? walkAnimation.frames : [characterDefinition.savePreview.frame];
});
const currentPlayerWalkStyle = computed(() => {
  const characterDefinition = resolvePlayerRuntimeCharacterDefinition();
  const displayScale = resolvePlayerCharacterUiPreviewScale(
    characterDefinition.previewAsset.frameHeight
  );

  return {
    '--character-hop-amplitude': `${characterDefinition.hopAmplitude * displayScale}px`,
    '--character-hop-animation': characterDefinition.movementStyle === 'hop'
      ? 'character-walk-hop-cycle 0.72s steps(1, end) infinite'
      : 'none'
  };
});
const currentPlayerWalkIsHop = computed(() => {
  const characterDefinition = resolvePlayerRuntimeCharacterDefinition();

  return characterDefinition.movementStyle === 'hop';
});
const currentPlayerWalkFrameStyles = computed(() => {
  const characterDefinition = resolvePlayerRuntimeCharacterDefinition();
  const frameColumns = characterDefinition.savePreview.columns;
  const walkFrames = currentPlayerWalkFrames.value;
  const displayScale = resolvePlayerCharacterUiPreviewScale(
    characterDefinition.previewAsset.frameHeight
  );
  const idleTextureKey = getPlayerCharacterFrameTextureKey(
    characterDefinition.appearanceId,
    'down',
    'idle'
  );
  const idleDisplayOrigin = resolveCharacterTextureDisplayOrigin({
    textureAnchor: idleTextureKey
      ? getLayeredCharacterTextureAnchor(idleTextureKey)
      : null,
    fallbackOrigin: {
      x: characterDefinition.previewAsset.frameWidth / 2,
      y: characterDefinition.displayOriginY
        ?? characterDefinition.previewAsset.frameHeight / 2
    },
    configuredDisplayOriginY: characterDefinition.displayOriginY,
    frameHeight: characterDefinition.previewAsset.frameHeight
  });
  const targetY = (64 - playerCharacterUiPreviewHeight) / 2
    + idleDisplayOrigin.y * displayScale;

  return walkFrames.map((frameIndex, index) => resolveSpriteFrameStyle(
    characterDefinition,
    frameIndex,
    frameColumns,
    walkFrames.length,
    index,
    displayScale,
    targetY
  ));
});
const characterStats = computed(() => {
  const characterDefinition = resolvePlayerRuntimeCharacterDefinition();

  return [
    {
      key: 'location',
      label: '所在地点',
      value: props.currentMapName || '未知地点'
    },
    {
      key: 'position',
      label: '当前位置',
      value: props.currentPosition
        ? `X ${Math.round(props.currentPosition.x)} / Y ${Math.round(props.currentPosition.y)}`
        : '尚未同步'
    },
    {
      key: 'status',
      label: '拘束状态',
      value: currentPlayerStatusText.value
    },
    {
      key: 'speed',
      label: '移动速度',
      value: characterDefinition.canMove
        ? `${(characterDefinition.defaultMoveSpeed * characterDefinition.movementSpeedMultiplier).toFixed(1)}`
        : '无法移动'
    }
  ];
});

const currentLocationText = computed(() => {
  if (!props.currentPosition) {
    return '当前位置尚未同步。';
  }

  return `坐标 X ${Math.round(props.currentPosition.x)} / Y ${Math.round(props.currentPosition.y)}`;
});

const overwriteConfirmMessage = computed(() => {
  if (!pendingOverwriteSaveSlotId.value) {
    return '';
  }

  return `当前进度会写入存档 ${pendingOverwriteSaveSlotId.value}，原来的记录会被替换。`;
});

const deleteConfirmMessage = computed(() => {
  if (!pendingDeleteSave.value) {
    return '';
  }

  return `存档 ${pendingDeleteSave.value.slotId} 删除后不能从浏览器本机恢复。`;
});

const deleteAllConfirmMessage = computed(() => {
  const saveCount = props.saves.length;

  if (saveCount === 0) {
    return '当前没有可清空的浏览器本机存档。';
  }

  return `将删除当前浏览器里的 ${saveCount} 个本机存档，删除后不能从浏览器本机恢复。`;
});

const importConfirmMessage = computed(() => {
  if (!pendingImportFile.value) {
    return '';
  }

  return `导入 ${pendingImportFile.value.name} 会覆盖当前浏览器里的全部存档。`;
});

const confirmOverwriteSave = (slotId) => {
  pendingOverwriteSaveSlotId.value = slotId;
};

const clearPendingOverwriteSave = () => {
  pendingOverwriteSaveSlotId.value = '';
};

const handleOverwriteSaveConfirm = () => {
  if (!pendingOverwriteSaveSlotId.value) {
    return;
  }

  emit('save-game', pendingOverwriteSaveSlotId.value);
  clearPendingOverwriteSave();
};

const confirmDeleteSave = (save) => {
  pendingDeleteSave.value = save;
};

const clearPendingDeleteSave = () => {
  pendingDeleteSave.value = null;
};

const handleDeleteSaveConfirm = () => {
  if (!pendingDeleteSave.value) {
    return;
  }

  emit('delete-save', pendingDeleteSave.value.slotId);
  clearPendingDeleteSave();
};

const confirmDeleteAllSaves = () => {
  if (props.saves.length === 0) {
    return;
  }

  pendingDeleteAllSaves.value = true;
};

const clearPendingDeleteAllSaves = () => {
  pendingDeleteAllSaves.value = false;
};

const handleDeleteAllSavesConfirm = () => {
  emit('delete-all-saves');
  clearPendingDeleteAllSaves();
};

const handleImportFileChange = async (event) => {
  const input = event.target;
  const file = input.files?.[0];
  input.value = '';

  if (!file) {
    return;
  }

  pendingImportFile.value = file;
};

const clearPendingImportFile = () => {
  pendingImportFile.value = null;
};

const handleImportFileConfirm = async () => {
  const file = pendingImportFile.value;

  if (!file) {
    return;
  }

  clearPendingImportFile();
  const text = await file.text();
  emit('import-saves', text);
};

watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      nextTick(focusActiveMenuTab);
      return;
    }

    clearPendingDeleteSave();
    clearPendingDeleteAllSaves();
    clearPendingOverwriteSave();
    clearPendingImportFile();
    clearAllContentCategory();
  }
);

watch(activeTabKey, () => {
  clearAllContentCategory();
});

watch(activeInventoryCategory, (category) => {
  if (!category) {
    clearActiveInventorySlot();
    return;
  }

  if (!category.slots.some((slot) => slot.key === activeInventorySlotKey.value)) {
    clearActiveInventorySlot();
  }
});

watch(activeSkillCategory, (category) => {
  if (!category) {
    clearActiveSkillSlot();
    return;
  }

  if (!category.slots.some((slot) => slot.key === activeSkillSlotKey.value)) {
    clearActiveSkillSlot();
  }
});

watch(activeEquipmentCategory, (category) => {
  if (!category) {
    clearActiveEquipmentItem();
    return;
  }

  if (!category.items.some((item) => item.key === activeEquipmentItemKey.value)) {
    activeEquipmentItemKey.value = category.items[0]?.key ?? '';
  }
});

watch(activeRestraintCategory, (category) => {
  if (!category) {
    clearActiveRestraintItem();
    return;
  }

  if (!category.items.some((item) => item.key === activeRestraintItemKey.value)) {
    activeRestraintItemKey.value = category.items[0]?.key ?? '';
  }
});
</script>
