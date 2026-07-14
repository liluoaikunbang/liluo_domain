<template>
            <section class="inventory-menu-panel" aria-label="物品栏">
              <section class="menu-card inventory-card" aria-label="物品栏内容">
                <div class="inventory-resource-row" aria-label="当前资源数量">
                  <span>{{ formatResourceText('金币', goldAmount) }}</span>
                  <span>{{ formatResourceText('绮欲结晶', desireCrystalAmount) }}</span>
                </div>

                <div class="inventory-category-tabs" role="tablist" aria-label="物品分类">
                  <button
                    v-for="category in inventoryCategories"
                    :key="category.key"
                    class="inventory-category-tab"
                    :class="{ 'inventory-category-tab-active': category.key === activeInventoryCategoryKey }"
                    :data-menu-nav="true"
                    data-menu-group="item-categories"
                    :data-menu-key="category.key"
                    type="button"
                    role="tab"
                    :aria-selected="category.key === activeInventoryCategoryKey"
                    @focus="$emit('select-category', category.key)"
                    @click="$emit('select-category', category.key)"
                  >
                    {{ category.label }}
                  </button>
                </div>

                <section
                  v-if="activeInventoryCategory"
                  class="inventory-category-panel"
                  role="tabpanel"
                  :aria-label="activeInventoryCategory.label"
                >
                  <div class="inventory-category-heading">
                    <span class="inventory-category-note">{{ activeInventoryCategory.description }}</span>
                  </div>

                  <div class="inventory-placeholder-grid" aria-label="物品占位格">
                    <template v-if="activeInventoryCategory.slots.length > 0">
                      <article
                        v-for="slot in activeInventoryCategory.slots"
                        :key="slot.key"
                        class="inventory-empty-slot"
                        :class="{ 'inventory-empty-slot-active': slot.key === activeInventorySlotKey }"
                        :data-menu-nav="true"
                        data-menu-group="item-slots"
                        :data-menu-key="slot.key"
                        tabindex="0"
                        role="button"
                        :aria-label="slot.title"
                        :aria-selected="slot.key === activeInventorySlotKey"
                        @focus="$emit('select-slot', slot.key)"
                        @click="$emit('select-slot', slot.key)"
                      >
                        <span class="inventory-slot-icon" aria-hidden="true"></span>
                        <div class="inventory-slot-copy">
                          <span class="inventory-slot-title">{{ slot.title }}</span>
                          <p class="menu-card-text">{{ slot.summary }}</p>
                        </div>
                      </article>
                    </template>
                    <div v-else class="inventory-empty-state" role="status">
                      暂无物品
                    </div>
                  </div>

                  <section class="inventory-detail-panel" aria-label="物品详情">
                    <template v-if="activeInventorySlot">
                      <div class="inventory-detail-heading">
                        <strong class="inventory-detail-title">{{ activeInventorySlot.title }}</strong>
                      </div>
                      <p
                        v-for="paragraph in resolvePlaceholderDetailParagraphs(activeInventorySlot, placeholderItemDetailParagraphs)"
                        :key="paragraph"
                        class="menu-card-text"
                      >
                        {{ paragraph }}
                      </p>
                    </template>
                  </section>
                </section>
              </section>
            </section>
</template>

<script setup>
import { formatResourceText, resolvePlaceholderDetailParagraphs } from './gameMenuHelpers';

defineProps({
  inventoryCategories: { type: Array, default: () => [] },
  activeInventoryCategory: { type: Object, default: null },
  activeInventoryCategoryKey: { type: String, default: '' },
  activeInventorySlot: { type: Object, default: null },
  activeInventorySlotKey: { type: String, default: '' },
  goldAmount: { type: Number, default: 0 },
  desireCrystalAmount: { type: Number, default: 0 },
  placeholderItemDetailParagraphs: { type: Array, default: () => [] }
});

defineEmits(['select-category', 'select-slot']);
</script>
