<template>
            <section class="equipment-menu-panel" aria-label="拘束栏">
              <section class="menu-card equipment-card" aria-label="拘束栏内容">
                <section class="equipment-slot-panel" aria-label="拘束分栏">
                  <div class="equipment-slot-heading">
                    <span class="menu-card-label">拘束分类</span>
                  </div>

                  <button
                    v-for="category in restraintCategories"
                    :key="category.key"
                    class="equipment-slot-tab"
                    :class="{ 'equipment-slot-tab-active': category.key === activeRestraintCategoryKey }"
                    :data-menu-nav="true"
                    data-menu-group="restraint-categories"
                    :data-menu-key="category.key"
                    type="button"
                    @click="$emit('select-category', category.key)"
                  >
                    {{ category.label }}
                  </button>
                </section>

                <section class="equipment-list-panel" :aria-label="`${activeRestraintCategory?.label ?? '拘束'}列表`">
                  <div class="equipment-panel-heading">
                    <strong class="inventory-detail-title">{{ activeRestraintCategory?.label ?? '选择分栏' }}</strong>
                    <span v-if="activeRestraintCategory?.description" class="inventory-category-note">
                      {{ activeRestraintCategory.description }}
                    </span>
                  </div>

                  <div class="equipment-list" aria-label="拘束条目">
                    <article
                      v-for="item in activeRestraintItems"
                      :key="item.key"
                      class="equipment-list-item"
                      :class="{ 'equipment-list-item-active': item.key === activeRestraintItemKey }"
                      :data-menu-nav="true"
                      data-menu-group="restraint-items"
                      :data-menu-key="item.key"
                      tabindex="0"
                      role="button"
                      :aria-label="item.title"
                      :aria-selected="item.key === activeRestraintItemKey"
                      @focus="$emit('select-item', item.key)"
                      @click="$emit('select-item', item.key)"
                    >
                      <span class="equipment-item-title">{{ item.title }}</span>
                      <span class="equipment-item-status">{{ item.summary }}</span>
                    </article>
                  </div>
                </section>

                <section class="equipment-preview-panel" aria-label="拘束预览">
                  <img
                    v-if="activePlayerPortrait.src"
                    class="equipment-preview-portrait"
                    :src="activePlayerPortrait.src"
                    :alt="activePlayerPortrait.alt ?? '角色立绘'"
                  >
                  <span v-else class="equipment-preview-empty">暂无立绘</span>
                </section>

                <section class="equipment-detail-panel" aria-label="拘束详情">
                  <div class="equipment-detail-content">
                    <template v-if="activeRestraintItem">
                      <div class="inventory-detail-heading">
                        <span class="menu-card-label">{{ activeRestraintCategory?.label }}</span>
                        <strong class="inventory-detail-title">{{ activeRestraintItem.title }}</strong>
                      </div>
                      <p
                        v-for="paragraph in resolvePlaceholderDetailParagraphs(activeRestraintItem, placeholderRestraintDetailParagraphs)"
                        :key="paragraph"
                        class="menu-card-text"
                      >
                        {{ paragraph }}
                      </p>
                    </template>
                  </div>

                  <div class="equipment-detail-actions" aria-label="拘束操作">
                    <button
                      class="equipment-detail-action"
                      type="button"
                      :disabled="!activeRestraintItem"
                      :data-menu-nav="true"
                      data-menu-group="restraint-actions"
                      data-menu-key="equip"
                    >
                      穿戴（替换）拘束
                    </button>
                    <button
                      class="equipment-detail-action equipment-detail-action-secondary"
                      type="button"
                      :disabled="!activeRestraintItem"
                      :data-menu-nav="true"
                      data-menu-group="restraint-actions"
                      data-menu-key="unequip"
                    >
                      卸下拘束
                    </button>
                  </div>
                </section>
              </section>
            </section>
</template>

<script setup>
import { resolvePlaceholderDetailParagraphs } from './gameMenuHelpers';

defineProps({
  restraintCategories: { type: Array, default: () => [] },
  activeRestraintCategory: { type: Object, default: null },
  activeRestraintCategoryKey: { type: String, default: '' },
  activeRestraintItems: { type: Array, default: () => [] },
  activeRestraintItem: { type: Object, default: null },
  activeRestraintItemKey: { type: String, default: '' },
  activePlayerPortrait: { type: Object, default: () => ({}) },
  placeholderRestraintDetailParagraphs: { type: Array, default: () => [] }
});

defineEmits(['select-category', 'select-item']);
</script>
