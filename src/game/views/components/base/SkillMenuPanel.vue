<template>
            <section class="skills-menu-panel" aria-label="技能栏">
              <section class="menu-card skills-card" aria-label="技能栏内容">
                <div class="inventory-category-tabs" role="tablist" aria-label="技能分类">
                  <button
                    v-for="category in skillCategories"
                    :key="category.key"
                    class="inventory-category-tab"
                    :class="{ 'inventory-category-tab-active': category.key === activeSkillCategoryKey }"
                    :data-menu-nav="true"
                    data-menu-group="skill-categories"
                    :data-menu-key="category.key"
                    type="button"
                    role="tab"
                    :aria-selected="category.key === activeSkillCategoryKey"
                    @focus="$emit('select-category', category.key)"
                    @click="$emit('select-category', category.key)"
                  >
                    {{ category.label }}
                  </button>
                </div>

                <section
                  v-if="activeSkillCategory"
                  class="inventory-category-panel"
                  role="tabpanel"
                  :aria-label="activeSkillCategory.label"
                >
                  <div class="inventory-category-heading">
                    <span class="inventory-category-note">{{ activeSkillCategory.description }}</span>
                  </div>

                  <div class="inventory-placeholder-grid" aria-label="技能占位格">
                    <article
                      v-for="slot in activeSkillCategory.slots"
                      :key="slot.key"
                      class="inventory-empty-slot skill-empty-slot"
                      :class="{ 'inventory-empty-slot-active': slot.key === activeSkillSlotKey }"
                      :data-menu-nav="true"
                      data-menu-group="skill-slots"
                      :data-menu-key="slot.key"
                      tabindex="0"
                      role="button"
                      :aria-label="slot.title"
                      :aria-selected="slot.key === activeSkillSlotKey"
                      @focus="$emit('select-slot', slot.key)"
                      @click="$emit('select-slot', slot.key)"
                    >
                      <span class="inventory-slot-icon skill-slot-icon" aria-hidden="true"></span>
                      <div class="inventory-slot-copy">
                        <span class="inventory-slot-title">{{ slot.title }}</span>
                        <p class="menu-card-text">{{ slot.summary }}</p>
                      </div>
                    </article>
                  </div>

                  <section class="inventory-detail-panel" aria-label="技能详情">
                    <template v-if="activeSkillSlot">
                      <div class="inventory-detail-heading">
                        <strong class="inventory-detail-title">{{ activeSkillSlot.title }}</strong>
                      </div>
                      <p
                        v-for="paragraph in resolvePlaceholderDetailParagraphs(activeSkillSlot, placeholderSkillDetailParagraphs)"
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
import { resolvePlaceholderDetailParagraphs } from './gameMenuHelpers';

defineProps({
  skillCategories: { type: Array, default: () => [] },
  activeSkillCategory: { type: Object, default: null },
  activeSkillCategoryKey: { type: String, default: '' },
  activeSkillSlot: { type: Object, default: null },
  activeSkillSlotKey: { type: String, default: '' },
  placeholderSkillDetailParagraphs: { type: Array, default: () => [] }
});

defineEmits(['select-category', 'select-slot']);
</script>
