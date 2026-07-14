<template>
  <section class="codex-menu-panel" aria-label="图鉴栏">
    <section class="menu-card codex-card" aria-label="图鉴内容">
      <div class="inventory-category-tabs codex-category-tabs" role="tablist" aria-label="图鉴分类">
        <button
          v-for="category in codexCategories"
          :key="category.key"
          class="inventory-category-tab"
          :class="{ 'inventory-category-tab-active': category.key === activeCodexCategoryKey }"
          :data-menu-nav="true"
          data-menu-group="codex-categories"
          :data-menu-key="category.key"
          type="button"
          role="tab"
          :aria-selected="category.key === activeCodexCategoryKey"
          @focus="$emit('select-category', category.key)"
          @click="$emit('select-category', category.key)"
        >
          {{ category.label }}
        </button>
      </div>

      <section
        v-if="activeCodexCategory"
        class="inventory-category-panel codex-category-panel"
        role="tabpanel"
        :aria-label="activeCodexCategory.label"
      >
        <label class="codex-world-filter">
          <span class="codex-world-filter-label">世界</span>
          <select
            v-model="activeCodexWorldKey"
            class="codex-world-select"
            :aria-label="`${activeCodexCategory.label}世界筛选`"
          >
            <option
              v-for="world in normalizedCodexWorldOptions"
              :key="world.key"
              :value="world.key"
            >
              {{ world.label }}
            </option>
          </select>
        </label>

        <div v-if="activeCodexCategory.description" class="inventory-category-heading">
          <span class="inventory-category-note">{{ activeCodexCategory.description }}</span>
        </div>

        <div v-if="isActiveImageGalleryCategory" class="codex-gallery-section">
          <p class="codex-gallery-prologue">
            {{ activeImageGalleryPrologue }}{{ imageGalleryStatsText }}
          </p>
          <div class="codex-gallery-grid" :aria-label="activeImageGalleryAriaLabel">
            <template v-if="filteredActiveCodexSlots.length > 0">
              <div
                v-for="(slot, index) in filteredActiveCodexSlots"
                :key="slot.key"
                class="codex-cg-card-wrap"
                :class="{ 'codex-cg-card-active': slot.key === activeCodexSlotKey }"
              >
                <button
                  class="codex-cg-card"
                  :data-menu-nav="true"
                  data-menu-group="codex-slots"
                  :data-menu-key="slot.key"
                  type="button"
                  :aria-label="`${formatGalleryCode(index)} ${slot.title}`"
                  :aria-selected="slot.key === activeCodexSlotKey"
                  @focus="$emit('select-slot', slot.key)"
                  @click="openCgPreview(slot, index)"
                >
                  <span class="codex-cg-image-frame">
                    <img class="codex-cg-image" :src="resolveCgImage(slot)" :alt="slot.title" />
                    <span v-if="hasCgContentWarning(slot)" class="codex-cg-warning-mask" aria-hidden="true">
                      <strong class="codex-cg-warning-title">{{ getPrimaryCgContentWarning(slot).previewTitle }}</strong>
                      <span class="codex-cg-warning-note">标签：{{ getPrimaryCgContentWarning(slot).note }}</span>
                    </span>
                  </span>
                  <span class="codex-cg-code">{{ formatGalleryCode(index) }}</span>
                  <span v-if="hasCgContentWarning(slot)" class="codex-cg-warning-badge">
                    {{ getPrimaryCgContentWarning(slot).label }}
                  </span>
                  <span
                    v-if="isSceneLocation(slot) ? slot.scenes.length > 1 : getCgVariantCount(slot) > 1"
                    class="codex-cg-variant-count"
                  >
                    {{ isSceneLocation(slot) ? `${slot.scenes.length} 画面` : `${getCgVariantCount(slot)} 差分` }}
                  </span>
                </button>
              </div>
            </template>
            <div v-else class="codex-gallery-empty" role="status">
              {{ activeCodexWorldLabel }}暂无{{ activeCodexCategory.label }}
            </div>
          </div>
        </div>

        <div v-else-if="activeCodexCategory.key === 'items'" class="codex-item-section">
          <div class="inventory-category-tabs codex-item-category-tabs" role="tablist" aria-label="图鉴物品分类">
            <button
              v-for="category in filteredCodexItemSubcategories"
              :key="category.key"
              class="inventory-category-tab"
              :class="{ 'inventory-category-tab-active': category.key === activeCodexItemCategoryKey }"
              type="button"
              role="tab"
              :aria-selected="category.key === activeCodexItemCategoryKey"
              @click="selectCodexItemCategory(category.key)"
            >
              {{ category.label }}
            </button>
          </div>

          <div class="inventory-placeholder-grid codex-entry-grid" aria-label="图鉴物品条目">
            <article
              v-for="slot in visibleCodexSlots"
              :key="slot.key"
              class="inventory-empty-slot codex-entry-card"
              :class="{ 'inventory-empty-slot-active': slot.key === activeCodexSlotKey }"
              :data-menu-nav="true"
              data-menu-group="codex-slots"
              :data-menu-key="slot.key"
              tabindex="0"
              role="button"
              :aria-label="slot.title"
              :aria-selected="slot.key === activeCodexSlotKey"
              @focus="$emit('select-slot', slot.key)"
              @click="$emit('select-slot', slot.key)"
            >
              <button
                v-if="slot.iconUrl"
                class="inventory-slot-icon inventory-slot-icon-has-image inventory-slot-icon-button codex-slot-icon codex-slot-icon-items"
                type="button"
                :aria-label="`查看${slot.title}大图`"
                @click.stop="openItemIconPreview(slot)"
              >
                <img
                  class="inventory-slot-icon-image"
                  :src="slot.iconUrl"
                  alt=""
                />
              </button>
              <span
                v-else
                class="inventory-slot-icon codex-slot-icon codex-slot-icon-items"
                aria-hidden="true"
              >
              </span>
              <div class="inventory-slot-copy">
                <span class="inventory-slot-title">{{ slot.title }}</span>
                <p class="menu-card-text">{{ slot.summary }}</p>
              </div>
            </article>
            <div v-if="visibleCodexSlots.length === 0" class="inventory-empty-state" role="status">
              {{ activeCodexWorldLabel }}暂无{{ activeCodexCategory.label }}
            </div>
          </div>
        </div>

        <div v-else class="inventory-placeholder-grid codex-entry-grid" aria-label="图鉴条目">
          <article
            v-for="slot in visibleCodexSlots"
            :key="slot.key"
            class="inventory-empty-slot codex-entry-card"
            :class="{ 'inventory-empty-slot-active': slot.key === activeCodexSlotKey }"
            :data-menu-nav="true"
            data-menu-group="codex-slots"
            :data-menu-key="slot.key"
            tabindex="0"
            role="button"
            :aria-label="slot.title"
            :aria-selected="slot.key === activeCodexSlotKey"
            @focus="$emit('select-slot', slot.key)"
            @click="$emit('select-slot', slot.key)"
          >
            <span
              class="inventory-slot-icon codex-slot-icon"
              :class="`codex-slot-icon-${activeCodexCategory.key}`"
              aria-hidden="true"
            ></span>
            <div class="inventory-slot-copy">
              <span class="inventory-slot-title">{{ slot.title }}</span>
              <p class="menu-card-text">{{ slot.summary }}</p>
            </div>
          </article>
          <div v-if="visibleCodexSlots.length === 0" class="inventory-empty-state" role="status">
            {{ activeCodexWorldLabel }}暂无{{ activeCodexCategory.label }}
          </div>
        </div>

        <section
          v-if="!isActiveImageGalleryCategory"
          class="inventory-detail-panel codex-detail-panel"
          aria-label="图鉴详情"
        >
          <template v-if="visibleActiveCodexSlot">
            <div class="inventory-detail-heading">
              <span class="menu-card-label">{{ visibleCodexDetailLabel }}</span>
              <strong class="inventory-detail-title">{{ visibleActiveCodexSlot.title }}</strong>
            </div>
            <p
              v-for="paragraph in resolvePlaceholderDetailParagraphs(visibleActiveCodexSlot, placeholderCodexDetailParagraphs)"
              :key="paragraph"
              class="menu-card-text"
            >
              {{ paragraph }}
            </p>
          </template>
        </section>
      </section>
    </section>

    <div
      v-if="previewCgSlot"
      class="codex-cg-preview"
      role="dialog"
      aria-modal="true"
      :aria-label="`${previewCgCode} ${previewGalleryLabel}预览`"
      @click="closeCgPreview"
    >
      <button class="codex-cg-preview-close" type="button" :aria-label="`关闭${previewGalleryLabel}预览`" @click.stop="closeCgPreview">
        ×
      </button>
      <button
        v-if="!isPreviewSceneGallery && canPreviewPreviousCg"
        class="codex-cg-preview-nav codex-cg-preview-nav-prev"
        type="button"
        :aria-label="`查看上一张${previewGalleryLabel}`"
        @click.stop="showAdjacentCgPreview(-1)"
      >
        ‹
      </button>
      <button
        v-if="!isPreviewSceneGallery && canPreviewNextCg"
        class="codex-cg-preview-nav codex-cg-preview-nav-next"
        type="button"
        :aria-label="`查看下一张${previewGalleryLabel}`"
        @click.stop="showAdjacentCgPreview(1)"
      >
        ›
      </button>
      <figure class="codex-cg-preview-figure" @click.stop>
        <aside
          v-if="previewCgVariants.length > 1"
          class="codex-cg-preview-variants codex-cg-preview-variants-left"
          :aria-label="hasPreviewCgLayerVariants ? '底图差分' : 'CG 差分列表'"
        >
          <strong v-if="hasPreviewCgLayerVariants" class="codex-cg-preview-variant-group-title">
            底图
          </strong>
          <button
            v-for="variant in previewCgLeftVariants"
            :key="variant.key"
            class="codex-cg-preview-variant"
            :class="{
              'codex-cg-preview-variant-active': isPreviewCgVariantSelected(variant)
            }"
            type="button"
            :aria-label="resolvePreviewCgVariantAriaLabel(variant)"
            :aria-pressed="isPreviewCgVariantSelected(variant)"
            @click.stop="selectPreviewCgVariant(variant)"
          >
            <span class="codex-cg-preview-variant-image-stack">
              <img
                v-for="(variantImage, imageIndex) in resolveCgVariantPreviewImages(variant)"
                :key="`${variant.key}-thumb-${imageIndex}`"
                class="codex-cg-preview-variant-image"
                :src="variantImage"
                :alt="imageIndex === 0 ? variant.label : ''"
                :aria-hidden="imageIndex > 0"
              />
            </span>
            <span class="codex-cg-preview-variant-label">{{ variant.label }}</span>
          </button>
        </aside>
        <div class="codex-cg-preview-stage">
          <span class="codex-cg-preview-image-stack">
            <img
              v-for="(previewImage, imageIndex) in resolvePreviewCgImages()"
              :key="`${previewCgSlot.key}-${previewCgVariantIndex}-${imageIndex}`"
              class="codex-cg-preview-image"
              :src="previewImage"
              :alt="imageIndex === 0 ? previewInfoTitle : ''"
              :aria-hidden="imageIndex > 0"
            />
          </span>
          <button
            v-for="navigation in previewSceneNavigation"
            :key="`${activePreviewScene.key}-${navigation.direction}-${navigation.target}`"
            class="codex-scene-preview-nav"
            :class="`codex-scene-preview-nav-${navigation.direction}`"
            type="button"
            :aria-label="navigation.label"
            @click.stop="navigatePreviewScene(navigation)"
          >
            {{ resolveSceneNavigationSymbol(navigation.direction) }}
          </button>
          <figcaption class="codex-cg-preview-code">{{ previewCgCode }}</figcaption>
          <aside
            class="codex-cg-preview-info"
            :class="{ 'codex-cg-preview-info-collapsed': isPreviewCgInfoCollapsed }"
            :aria-label="`${previewGalleryLabel}简介`"
          >
            <div v-if="!isPreviewCgInfoCollapsed" class="codex-cg-preview-info-copy">
              <span class="codex-cg-preview-info-code">{{ previewCgCode }}</span>
              <strong class="codex-cg-preview-info-title">{{ previewInfoTitle }}</strong>
              <p class="codex-cg-preview-info-summary">
                {{ resolveCgInfoText(previewCgSlot) }}
              </p>
            </div>
            <button
              class="codex-cg-preview-info-toggle"
              type="button"
              :aria-expanded="!isPreviewCgInfoCollapsed"
              :aria-label="`${isPreviewCgInfoCollapsed ? '展开' : '收起'}${previewGalleryLabel}简介`"
              @click.stop="togglePreviewCgInfo"
            >
              {{ isPreviewCgInfoCollapsed ? '展开' : '收起' }}
            </button>
          </aside>
        </div>
        <aside
          v-if="previewCgRightVariants.length"
          class="codex-cg-preview-variants codex-cg-preview-variants-right"
          aria-label="可叠加差分"
        >
          <strong class="codex-cg-preview-variant-group-title">叠加层</strong>
          <button
            v-for="variant in previewCgRightVariants"
            :key="variant.key"
            class="codex-cg-preview-variant"
            :class="{
              'codex-cg-preview-variant-active': isPreviewCgVariantSelected(variant)
            }"
            type="button"
            :aria-label="resolvePreviewCgVariantAriaLabel(variant)"
            :aria-pressed="isPreviewCgVariantSelected(variant)"
            @click.stop="selectPreviewCgVariant(variant)"
          >
            <span class="codex-cg-preview-variant-image-stack">
              <img
                v-for="(variantImage, imageIndex) in resolveCgVariantPreviewImages(variant)"
                :key="`${variant.key}-thumb-${imageIndex}`"
                class="codex-cg-preview-variant-image"
                :src="variantImage"
                :alt="imageIndex === 0 ? variant.label : ''"
                :aria-hidden="imageIndex > 0"
              />
            </span>
            <span class="codex-cg-preview-variant-label">
              <span class="codex-cg-preview-variant-check" aria-hidden="true"></span>
              {{ variant.label }}
            </span>
          </button>
        </aside>
      </figure>
    </div>

    <div
      v-if="previewItemIconSlot"
      class="codex-item-icon-preview"
      role="dialog"
      aria-modal="true"
      :aria-label="`${previewItemIconSlot.title} 大图`"
      tabindex="-1"
      @click="closeItemIconPreview"
      @keydown.esc="closeItemIconPreview"
    >
      <button
        class="codex-cg-preview-close"
        type="button"
        aria-label="关闭物品大图"
        @click.stop="closeItemIconPreview"
      >
        ×
      </button>
      <figure class="codex-item-icon-preview-figure" @click.stop>
        <img
          class="codex-item-icon-preview-image"
          :src="previewItemIconSlot.iconUrl"
          :alt="previewItemIconSlot.title"
        />
        <figcaption class="codex-item-icon-preview-title">
          {{ previewItemIconSlot.title }}
        </figcaption>
      </figure>
    </div>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import placeholderCgImage from '../../../../assets/game/backgrounds/Liluo_bed.png';
import {
  resolveCgBaseVariant,
  resolveCgPreviewImages,
  resolveCgVariantColumns
} from '../../../data/global/cgVariantRules';
import { resolvePlaceholderDetailParagraphs } from './gameMenuHelpers';

const props = defineProps({
  codexCategories: { type: Array, default: () => [] },
  codexWorldOptions: { type: Array, default: () => [] },
  activeCodexCategory: { type: Object, default: null },
  activeCodexCategoryKey: { type: String, default: '' },
  activeCodexSlot: { type: Object, default: null },
  activeCodexSlotKey: { type: String, default: '' },
  placeholderCodexDetailParagraphs: { type: Array, default: () => [] }
});

const emit = defineEmits(['select-category', 'select-slot']);

const previewCgSlot = ref(null);
const previewCgIndex = ref(0);
const previewCgVariantIndex = ref(0);
const previewSceneKey = ref('');
const previewGalleryCategoryKey = ref('');
const selectedPreviewCgLayerKeys = ref(new Set());
const isPreviewCgInfoCollapsed = ref(false);
const activeCodexItemCategoryKey = ref('');
const activeCodexWorldKey = ref('all');
const previewItemIconSlot = ref(null);
const previewCgCode = computed(() => formatGalleryCode(previewCgIndex.value, previewGalleryCategoryKey.value));
const imageGalleryCategoryKeys = new Set(['cg', 'scenes']);
const isActiveImageGalleryCategory = computed(() => imageGalleryCategoryKeys.has(props.activeCodexCategory?.key));
const isPreviewSceneGallery = computed(() => previewGalleryCategoryKey.value === 'scenes');
const previewCgSlots = computed(() =>
  isActiveImageGalleryCategory.value ? filteredActiveCodexSlots.value : []
);
const activeImageGalleryAriaLabel = computed(() => `${props.activeCodexCategory?.label ?? '图片'}条目`);
const activeImageGalleryPrologue = computed(() => {
  if (props.activeCodexCategory?.key === 'scenes') {
    return '场景影卷收纳抵达过的地点、章节背景与事件舞台。';
  }

  return '诸界影录，各有其形；旧忆所映，皆为你曾经抵达之处。';
});
const previewGalleryLabel = computed(() => {
  if (previewGalleryCategoryKey.value === 'scenes') {
    return '场景图';
  }

  return 'CG';
});
const codexItemSubcategories = computed(() => props.activeCodexCategory?.subcategories ?? []);
const normalizedCodexWorldOptions = computed(() => {
  if (props.codexWorldOptions.length > 0) {
    return props.codexWorldOptions;
  }

  return [
    { key: 'all', label: '全部' },
    { key: 'urban', label: '都市' }
  ];
});
const activeCodexWorldLabel = computed(() =>
  normalizedCodexWorldOptions.value.find((world) => world.key === activeCodexWorldKey.value)?.label ?? '全部'
);
const filteredActiveCodexSlots = computed(() => filterCodexSlotsByWorld(props.activeCodexCategory?.slots ?? []));
const filteredCodexItemSubcategories = computed(() =>
  codexItemSubcategories.value.map((category) => ({
    ...category,
    slots: filterCodexSlotsByWorld(category.slots ?? [])
  }))
);
const activeCodexItemCategory = computed(() => {
  if (props.activeCodexCategory?.key !== 'items') {
    return null;
  }

  return filteredCodexItemSubcategories.value.find((category) => category.key === activeCodexItemCategoryKey.value) ??
    filteredCodexItemSubcategories.value[0] ??
    null;
});
const visibleCodexSlots = computed(() => {
  if (props.activeCodexCategory?.key === 'items' && activeCodexItemCategory.value) {
    return activeCodexItemCategory.value.slots ?? [];
  }

  return filteredActiveCodexSlots.value;
});
const visibleActiveCodexSlot = computed(() =>
  visibleCodexSlots.value.find((slot) => slot.key === props.activeCodexSlotKey) ?? null
);
const visibleCodexDetailLabel = computed(() =>
  props.activeCodexCategory?.key === 'items' && activeCodexItemCategory.value
    ? `${props.activeCodexCategory.label} / ${activeCodexItemCategory.value.label}`
    : props.activeCodexCategory?.label
);
const previewCgVariants = computed(() => resolveCgVariants(previewCgSlot.value));
const previewSceneViews = computed(() => previewCgSlot.value?.scenes ?? []);
const activePreviewScene = computed(() =>
  previewSceneViews.value.find((scene) => scene.key === previewSceneKey.value) ??
  previewSceneViews.value[0] ??
  null
);
const previewSceneNavigation = computed(() =>
  isPreviewSceneGallery.value ? activePreviewScene.value?.navigation ?? [] : []
);
const previewInfoTitle = computed(() => {
  if (!isPreviewSceneGallery.value || !activePreviewScene.value) {
    return previewCgSlot.value?.title ?? '';
  }

  return `${previewCgSlot.value.title} · ${activePreviewScene.value.title}`;
});
const selectedPreviewCgVariant = computed(() => previewCgVariants.value[previewCgVariantIndex.value] ?? null);
const hasPreviewCgLayerVariants = computed(() =>
  previewCgVariants.value.some((variant) => variant.displayMode === 'layer')
);
const previewCgBaseVariant = computed(() =>
  resolveCgBaseVariant(previewCgVariants.value, previewCgVariantIndex.value)
);
const previewCgVariantColumns = computed(() =>
  resolveCgVariantColumns(previewCgVariants.value)
);
const previewCgLeftVariants = computed(() => {
  return hasPreviewCgLayerVariants.value
    ? previewCgVariantColumns.value.baseVariants
    : previewCgVariants.value;
});
const previewCgRightVariants = computed(() =>
  hasPreviewCgLayerVariants.value
    ? previewCgVariantColumns.value.layerVariants
    : []
);
const canPreviewPreviousCg = computed(() => previewCgIndex.value > 0);
const canPreviewNextCg = computed(() => previewCgIndex.value < previewCgSlots.value.length - 1);
const imageGalleryStatsText = computed(() => {
  const cgTotal = previewCgSlots.value.length;
  const imageTotal = previewCgSlots.value.reduce((total, slot) => {
    if (isSceneLocation(slot)) {
      return total + slot.scenes.length;
    }

    const variantCount = getCgVariantCount(slot);
    return total + (variantCount > 0 ? variantCount : 0);
  }, 0);

  if (props.activeCodexCategory?.key === 'scenes') {
    return `（地点总数：${cgTotal}，场景图总数：${imageTotal}）`;
  }

  return `（CG 总数：${cgTotal}，含差分图片总数：${imageTotal}）`;
});

function formatGalleryCode(index, categoryKey = props.activeCodexCategory?.key) {
  const prefix = categoryKey === 'scenes' ? 'SCENE' : 'CG';

  return `${prefix}${String(index + 1).padStart(3, '0')}`;
}

function resolveCgImage(slot) {
  return slot?.image || slot?.variants?.[0]?.image || placeholderCgImage;
}

function isSceneLocation(slot) {
  return Array.isArray(slot?.scenes);
}

function resolveCgVariants(slot) {
  if (slot?.variants?.length > 0) {
    return slot.variants;
  }

  if (slot?.image) {
    return [
      {
        key: `${slot.key}-default`,
        label: '基础',
        image: slot.image
      }
    ];
  }

  return [];
}

function getCgVariantCount(slot) {
  return resolveCgVariants(slot).length;
}

function getCgContentWarnings(slot) {
  return Array.isArray(slot?.contentWarnings) ? slot.contentWarnings : [];
}

function hasCgContentWarning(slot) {
  return getCgContentWarnings(slot).length > 0;
}

function getPrimaryCgContentWarning(slot) {
  return getCgContentWarnings(slot)[0] ?? {
    label: 'R-18-G',
    previewTitle: 'R18-G 警告',
    note: '敏感内容'
  };
}

function resolveCgVariantImages(variant) {
  return [variant?.image || placeholderCgImage];
}

function resolveCgVariantPreviewImages(variant) {
  if (hasPreviewCgLayerVariants.value && variant?.displayMode === 'layer') {
    return [previewCgBaseVariant.value?.image || resolveCgImage(previewCgSlot.value), variant.image || placeholderCgImage];
  }

  return resolveCgVariantImages(variant);
}

function resolvePreviewCgImages() {
  if (isPreviewSceneGallery.value && activePreviewScene.value) {
    return [activePreviewScene.value.image];
  }

  if (hasPreviewCgLayerVariants.value) {
    return resolveCgPreviewImages(
      previewCgVariants.value,
      previewCgVariantIndex.value,
      selectedPreviewCgLayerKeys.value
    );
  }

  if (selectedPreviewCgVariant.value) {
    return resolveCgVariantImages(selectedPreviewCgVariant.value);
  }

  return [resolveCgImage(previewCgSlot.value)];
}

function isPreviewCgVariantSelected(variant) {
  if (!hasPreviewCgLayerVariants.value) {
    const variantIndex = previewCgVariants.value.findIndex((previewVariant) => previewVariant.key === variant?.key);
    return variantIndex === previewCgVariantIndex.value;
  }

  if (variant?.displayMode !== 'layer') {
    return previewCgBaseVariant.value?.key === variant?.key;
  }

  return Boolean(variant?.key && selectedPreviewCgLayerKeys.value.has(variant.key));
}

function resolvePreviewCgVariantAriaLabel(variant) {
  if (!hasPreviewCgLayerVariants.value) {
    return `切换到${variant.label}差分`;
  }

  if (variant?.displayMode !== 'layer') {
    return `切换到${variant.label}底图`;
  }

  return `${isPreviewCgVariantSelected(variant) ? '取消叠加' : '叠加'}${variant.label}图层`;
}

function resolveCgInfoText(slot) {
  if (isPreviewSceneGallery.value && activePreviewScene.value?.description) {
    return activePreviewScene.value.description;
  }

  return slot?.description || slot?.summary || '这张 CG 已收录到旅途图鉴中，可在这里回看画面与相关记忆。';
}

function resolveCodexSlotWorldKey(slot) {
  return slot?.worldKey || 'urban';
}

function filterCodexSlotsByWorld(slots) {
  if (activeCodexWorldKey.value === 'all') {
    return slots;
  }

  return slots.filter((slot) => resolveCodexSlotWorldKey(slot) === activeCodexWorldKey.value);
}

function getFirstVisibleCodexSlotKey() {
  if (props.activeCodexCategory?.key === 'items') {
    return filteredCodexItemSubcategories.value.find((category) => category.slots.length > 0)?.slots[0]?.key ?? '';
  }

  return filteredActiveCodexSlots.value[0]?.key ?? '';
}

function selectCodexItemCategory(key) {
  if (activeCodexItemCategoryKey.value === key) {
    return;
  }

  activeCodexItemCategoryKey.value = key;
  const nextSlotKey = filteredCodexItemSubcategories.value.find((category) => category.key === key)?.slots?.[0]?.key ?? '';
  emit('select-slot', nextSlotKey);
}

function togglePreviewCgInfo() {
  isPreviewCgInfoCollapsed.value = !isPreviewCgInfoCollapsed.value;
}

function openCgPreview(slot, index) {
  emit('select-slot', slot.key);
  previewCgSlot.value = slot;
  previewCgIndex.value = index;
  previewGalleryCategoryKey.value = props.activeCodexCategory?.key ?? 'cg';
  previewCgVariantIndex.value = 0;
  previewSceneKey.value = slot.defaultScene ?? slot.scenes?.[0]?.key ?? '';
  resetPreviewCgLayerSelection(slot);
  isPreviewCgInfoCollapsed.value = false;
}

function navigatePreviewScene(navigation) {
  if (!isPreviewSceneGallery.value) {
    return;
  }

  const targetScene = previewSceneViews.value.find((scene) => scene.key === navigation?.target);
  if (targetScene) {
    previewSceneKey.value = targetScene.key;
  }
}

function resolveSceneNavigationSymbol(direction) {
  return direction === 'left' ? '‹' : '›';
}

function selectPreviewCgVariant(variant) {
  const variantIndex = previewCgVariants.value.findIndex((previewVariant) => previewVariant.key === variant?.key);
  if (variantIndex < 0 || variantIndex >= previewCgVariants.value.length) {
    return;
  }

  if (hasPreviewCgLayerVariants.value) {
    if (!variant?.key) {
      return;
    }

    if (variant.displayMode === 'layer') {
      const nextKeys = new Set(selectedPreviewCgLayerKeys.value);
      if (nextKeys.has(variant.key)) {
        nextKeys.delete(variant.key);
      } else {
        nextKeys.add(variant.key);
      }

      selectedPreviewCgLayerKeys.value = nextKeys;
      return;
    }

    previewCgVariantIndex.value = variantIndex;
    return;
  }

  previewCgVariantIndex.value = variantIndex;
}

function resetPreviewCgLayerSelection(slot) {
  selectedPreviewCgLayerKeys.value = new Set();
}

function showAdjacentCgPreview(direction) {
  const slots = previewCgSlots.value;
  const nextIndex = previewCgIndex.value + direction;
  if (nextIndex < 0 || nextIndex >= slots.length) {
    return;
  }

  openCgPreview(slots[nextIndex], nextIndex);
}

function closeCgPreview() {
  previewCgSlot.value = null;
}

function openItemIconPreview(slot) {
  if (!slot?.iconUrl) {
    return;
  }

  emit('select-slot', slot.key);
  previewItemIconSlot.value = slot;
}

function closeItemIconPreview() {
  previewItemIconSlot.value = null;
}

function handleItemIconPreviewKeydown(event) {
  if (event.key !== 'Escape' || !previewItemIconSlot.value) {
    return;
  }

  closeItemIconPreview();
}

watch(previewItemIconSlot, (slot) => {
  if (slot) {
    window.addEventListener('keydown', handleItemIconPreviewKeydown);
    return;
  }

  window.removeEventListener('keydown', handleItemIconPreviewKeydown);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleItemIconPreviewKeydown);
});

watch(
  () => props.activeCodexCategory,
  (category) => {
    if (category?.key !== 'items') {
      closeItemIconPreview();
      emit('select-slot', getFirstVisibleCodexSlotKey());
      return;
    }

    const nextCategoryKey = category.subcategories?.[0]?.key ?? '';
    activeCodexItemCategoryKey.value = nextCategoryKey;
    emit('select-slot', getFirstVisibleCodexSlotKey());
  },
  { immediate: true }
);

watch(
  () => activeCodexWorldKey.value,
  () => {
    closeCgPreview();
    closeItemIconPreview();
    emit('select-slot', getFirstVisibleCodexSlotKey());
  }
);
</script>
