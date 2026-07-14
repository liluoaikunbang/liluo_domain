<template>
            <section class="equipment-menu-panel" aria-label="装备栏">
              <section class="menu-card equipment-card" aria-label="装备栏内容">
                <section class="equipment-slot-panel" aria-label="装备分栏">
                  <div class="equipment-slot-heading">
                    <span class="menu-card-label">装备分类</span>
                  </div>

                  <button
                    v-for="category in equipmentCategories"
                    :key="category.key"
                    class="equipment-slot-tab"
                    :class="{ 'equipment-slot-tab-active': category.key === activeEquipmentCategoryKey }"
                    :data-menu-nav="true"
                    data-menu-group="equipment-categories"
                    :data-menu-key="category.key"
                    type="button"
                    @click="$emit('select-category', category.key)"
                  >
                    {{ category.label }}
                  </button>
                </section>

                <section class="equipment-list-panel" :aria-label="`${activeEquipmentCategory?.label ?? '装备'}列表`">
                  <div class="equipment-panel-heading">
                    <strong class="inventory-detail-title">{{ activeEquipmentCategory?.label ?? '选择分栏' }}</strong>
                    <span v-if="activeEquipmentCategory?.description" class="inventory-category-note">
                      {{ activeEquipmentCategory.description }}
                    </span>
                  </div>

                  <article
                    class="equipment-current-item"
                    :class="{ 'equipment-current-item-active': activeEquippedItem?.key === activeEquipmentItemKey }"
                    :data-menu-nav="activeEquippedItem ? true : null"
                    data-menu-group="equipment-items"
                    :data-menu-key="activeEquippedItem?.key ?? 'current-empty'"
                    :tabindex="activeEquippedItem ? 0 : null"
                    :role="activeEquippedItem ? 'button' : null"
                    :aria-label="activeEquippedItem ? `当前装备：${activeEquippedItem.title}` : '当前装备：未装备'"
                    :aria-selected="activeEquippedItem?.key === activeEquipmentItemKey"
                    @focus="activeEquippedItem && $emit('select-item', activeEquippedItem.key)"
                    @click="activeEquippedItem && $emit('select-item', activeEquippedItem.key)"
                  >
                    <span class="equipment-current-label">当前装备</span>
                    <span class="equipment-current-title">{{ activeEquippedItem?.title ?? '未装备' }}</span>
                  </article>

                  <div class="equipment-list" aria-label="装备条目">
                    <article
                      v-for="item in scrollableEquipmentItems"
                      :key="item.key"
                      class="equipment-list-item"
                      :class="{ 'equipment-list-item-active': item.key === activeEquipmentItemKey }"
                      :data-menu-nav="true"
                      data-menu-group="equipment-items"
                      :data-menu-key="item.key"
                      tabindex="0"
                      role="button"
                      :aria-label="item.title"
                      :aria-selected="item.key === activeEquipmentItemKey"
                      @focus="$emit('select-item', item.key)"
                      @click="$emit('select-item', item.key)"
                    >
                      <span class="equipment-item-title">{{ item.title }}</span>
                      <span class="equipment-item-status">{{ item.summary }}</span>
                    </article>
                  </div>
                </section>

                <section class="equipment-detail-panel" aria-label="装备详情">
                  <div class="equipment-detail-content">
                    <template v-if="activeEquipmentItem">
                      <div class="inventory-detail-heading">
                        <span class="menu-card-label">{{ activeEquipmentCategory?.label }}</span>
                        <strong class="inventory-detail-title">{{ activeEquipmentItem.title }}</strong>
                      </div>
                      <p
                        v-for="paragraph in resolvePlaceholderDetailParagraphs(activeEquipmentItem, placeholderEquipmentDetailParagraphs)"
                        :key="paragraph"
                        class="menu-card-text"
                      >
                        {{ paragraph }}
                      </p>
                    </template>
                  </div>

                  <div class="equipment-detail-actions" aria-label="装备操作">
                    <button
                      class="equipment-detail-action"
                      type="button"
                      :disabled="!activeEquipmentItem"
                      :data-menu-nav="true"
                      data-menu-group="equipment-actions"
                      data-menu-key="equip"
                    >
                      穿戴（替换）装备
                    </button>
                    <button
                      class="equipment-detail-action equipment-detail-action-secondary"
                      type="button"
                      :disabled="!activeEquipmentItem"
                      :data-menu-nav="true"
                      data-menu-group="equipment-actions"
                      data-menu-key="unequip"
                    >
                      卸下装备
                    </button>
                  </div>
                </section>
              </section>
            </section>
</template>

<script setup>
import { computed } from 'vue';
import { resolvePlaceholderDetailParagraphs } from './gameMenuHelpers';

const props = defineProps({
  equipmentCategories: { type: Array, default: () => [] },
  activeEquipmentCategory: { type: Object, default: null },
  activeEquipmentCategoryKey: { type: String, default: '' },
  activeEquipmentItems: { type: Array, default: () => [] },
  activeEquipmentItem: { type: Object, default: null },
  activeEquipmentItemKey: { type: String, default: '' },
  placeholderEquipmentDetailParagraphs: { type: Array, default: () => [] }
});

defineEmits(['select-category', 'select-item']);

const activeEquippedItem = computed(() => props.activeEquipmentItems.find((item) => item.summary === '已装备') ?? null);
const scrollableEquipmentItems = computed(() => {
  if (!activeEquippedItem.value) {
    return props.activeEquipmentItems;
  }

  return props.activeEquipmentItems.filter((item) => item.key !== activeEquippedItem.value.key);
});
</script>
