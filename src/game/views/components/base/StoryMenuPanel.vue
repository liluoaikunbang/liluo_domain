<template>
  <section class="story-menu-panel" aria-label="故事栏">
    <section class="menu-card story-card" aria-label="故事大纲">
      <header class="story-panel-header">
        <div class="story-layout-controls" aria-label="故事展示模式">
          <button
            v-for="option in layoutModeOptions"
            :key="option.key"
            class="story-layout-button"
            :class="{ 'story-layout-button-active': layoutMode === option.key }"
            type="button"
            :aria-pressed="layoutMode === option.key"
            @click="setLayoutMode(option.key)"
          >
            {{ option.label }}
          </button>
        </div>
        <div v-if="isCanvasMode" class="story-zoom-controls" aria-label="故事画布缩放">
          <button class="story-control-button" type="button" aria-label="缩小故事画布" @click="zoomOut">-</button>
          <span class="story-zoom-value">{{ zoomPercent }}</span>
          <button class="story-control-button" type="button" aria-label="放大故事画布" @click="zoomIn">+</button>
          <button class="story-control-button story-control-button-wide" type="button" @click="resetView">重置</button>
        </div>
        <div class="story-export-controls" aria-label="故事大纲导出">
          <button class="story-export-control-button" type="button" @click="exportAllStoryJson(false)">导出简练JSON</button>
          <button class="story-export-control-button" type="button" @click="exportAllStoryJson(true)">导出完整JSON</button>
        </div>
      </header>

      <div
        v-if="isCanvasMode"
        ref="viewportRef"
        class="story-canvas-viewport"
        :class="{ 'story-canvas-viewport-dragging': isDragging }"
        tabindex="0"
        role="region"
        aria-label="故事大纲无限画布"
        @pointerdown="handlePointerDown"
        @pointermove="handlePointerMove"
        @pointerup="handlePointerUp"
        @pointercancel="handlePointerUp"
        @wheel="handleWheel"
      >
        <div class="story-canvas-spacer" :style="canvasSpacerStyle">
          <div class="story-canvas-content" :style="canvasContentStyle">
            <svg
              class="story-link-layer"
              :width="layout.canvasWidth"
              :height="layout.canvasHeight"
              aria-hidden="true"
            >
              <path
                v-for="link in layout.links"
                :key="link.key"
                class="story-link-path"
                :d="link.path"
              />
            </svg>

            <article
              v-for="node in layout.nodes"
              :key="node.key"
              class="story-node-card"
              :class="[
                `story-node-depth-${Math.min(node.depth, 3)}`,
                getNodeCardClass(node),
                {
                  'story-node-card-collapsed-preview': node.isCollapsedPreview,
                  'story-node-card-with-bottom-meta': hasNodeMetaRow(node)
                }
              ]"
              :style="node.style"
            >
              <template v-if="node.isCollapsedPreview">
                <strong class="story-node-collapsed-ellipsis">{{ node.title }}</strong>
                <span class="story-node-collapsed-label">{{ node.summary }}</span>
                <button
                  class="story-node-collapse-button"
                  type="button"
                  :aria-label="`展开${node.collapseTargetTitle}`"
                  aria-expanded="false"
                  @click.stop="toggleCategoryNode(node.collapseTargetKey)"
                >
                  +
                </button>
              </template>
              <template v-else>
                <div
                  v-if="isCategoryStatus(node.status) || node.metaItems.length > 0 || hasStoryDetail(node) || hasStoryCg(node) || hasLinkedGameplay(node)"
                  class="story-node-actions"
                >
                  <button
                    v-if="isCategoryStatus(node.status)"
                    class="story-node-export-button"
                    type="button"
                    :aria-label="`导出${node.title}分类JSON`"
                    @pointerdown.stop
                    @click.stop="exportCategoryJson(node)"
                  >
                    导出JSON
                  </button>
                  <div
                    v-if="node.metaItems.length > 0"
                    class="story-node-meta-flag"
                    tabindex="0"
                    :aria-label="`${node.title} 元信息`"
                    @pointerenter="updateMetaPopoverDirection"
                    @focusin="updateMetaPopoverDirection"
                  >
                    元信息
                    <div class="story-node-meta-popover" role="tooltip">
                      <dl class="story-node-meta-list">
                        <template v-for="item in node.metaItems" :key="item.label">
                          <dt>{{ item.label }}</dt>
                          <dd>{{ item.value }}</dd>
                        </template>
                      </dl>
                    </div>
                  </div>
                  <button
                    v-if="hasStoryDetail(node)"
                    class="story-node-detail-button"
                    type="button"
                    :aria-label="`查看${node.title}${node.detailLabel}`"
                    @click.stop="openDetail(node)"
                  >
                    {{ node.detailLabel }}
                  </button>
                  <button
                    v-if="hasStoryCg(node)"
                    class="story-node-cg-button"
                    type="button"
                    :aria-label="`查看${node.title}关联CG，共${getStoryCgEntries(node).length}项`"
                    @click.stop="openStoryCg(node)"
                  >
                    CG
                  </button>
                  <button
                    v-if="hasLinkedGameplay(node)"
                    class="story-node-gameplay-button"
                    type="button"
                    :aria-label="`查看${node.title}关联玩法，共${getLinkedGameplay(node).length}项`"
                    @click.stop="openGameplayLinks(node)"
                  >
                    关联玩法
                  </button>
                </div>
                <div v-if="hasNodeMetaRow(node)" class="story-node-meta-row">
                  <span v-if="node.displayStatus" class="story-node-status" :class="getStatusClass(node.displayStatus)">{{ node.displayStatus }}</span>
                  <span
                    v-if="shouldDisplayTemplateStatus(node)"
                    class="story-node-template-status"
                  >
                    旧版未模板化
                  </span>
                  <span v-for="storyTag in node.storyTags" :key="storyTag" class="story-node-story-tag">{{ storyTag }}</span>
                  <span
                    v-for="label in node.restraintRagLabels"
                    :key="`rag-${label}`"
                    class="story-node-restraint-rag-tag"
                  >{{ label }}</span>
                  <span v-if="node.timeline" class="story-node-timeline">{{ node.timeline }}</span>
                </div>
                <strong class="story-node-title">{{ node.title }}</strong>
                <p v-if="node.summary" class="story-node-summary">{{ node.summary }}</p>
                <button
                  v-if="hasMissingItems(node)"
                  class="story-node-missing-button"
                  type="button"
                  :aria-label="`查看${node.title}待补充内容，共${node.missingItems.length}项`"
                  @click.stop="openMissingItems(node)"
                >
                  待补充（{{ node.missingItems.length }}）
                </button>
                <button
                  v-if="node.canCollapse"
                  class="story-node-collapse-button"
                  type="button"
                  :aria-label="getCollapseLabel(node)"
                  :aria-expanded="!node.isCollapsed"
                  @click.stop="toggleCategoryNode(node.key)"
                >
                  {{ node.isCollapsed ? '+' : '-' }}
                </button>
              </template>
            </article>
          </div>
        </div>
      </div>

      <div v-else-if="layoutMode === 'table'" class="story-table-panel" aria-label="故事大纲表格">
        <header class="story-table-panel-header">
          <h2 class="story-table-panel-title">故事大纲表格</h2>
        </header>
        <div class="story-table-viewport" role="region" aria-label="故事大纲表格内容">
          <table class="story-table">
            <thead>
              <tr>
                <th scope="col">标题</th>
                <th scope="col">状态</th>
                <th scope="col">故事线</th>
                <th scope="col">概要</th>
                <th scope="col">情节引用</th>
                <th scope="col">紧缚 RAG</th>
                <th scope="col">紧缚 RAG 引用</th>
                <th scope="col">玩法引用</th>
                <th scope="col">主要角色</th>
                <th scope="col">所在地点</th>
                <th scope="col">需要异能</th>
                <th scope="col">伏笔</th>
                <th scope="col">父节点</th>
                <th scope="col">子节点</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="node in tableRows"
                :key="node.key"
                :class="`story-table-row-depth-${Math.min(node.depth, 3)}`"
              >
                <th scope="row" class="story-table-node-title">
                  <button
                    v-if="node.canCollapse"
                    class="story-table-collapse-button"
                    type="button"
                    :aria-label="getCollapseLabel(node)"
                    :aria-expanded="!node.isCollapsed"
                    @click.stop="toggleCategoryNode(node.key)"
                  >
                    {{ node.isCollapsed ? '+' : '-' }}
                  </button>
                  <span class="story-table-title">{{ node.title }}</span>
                  <button
                    v-if="hasStoryDetail(node)"
                    class="story-table-detail-button"
                    type="button"
                    :aria-label="`查看${node.title}${node.detailLabel}`"
                    @click.stop="openDetail(node)"
                  >
                    {{ node.detailLabel }}
                  </button>
                  <button
                    v-if="hasStoryCg(node)"
                    class="story-table-detail-button"
                    type="button"
                    :aria-label="`查看${node.title}关联CG，共${getStoryCgEntries(node).length}项`"
                    @click.stop="openStoryCg(node)"
                  >
                    CG
                  </button>
                  <button
                    v-if="hasLinkedGameplay(node)"
                    class="story-table-detail-button"
                    type="button"
                    :aria-label="`查看${node.title}关联玩法，共${getLinkedGameplay(node).length}项`"
                    @click.stop="openGameplayLinks(node)"
                  >
                    关联玩法
                  </button>
                  <button
                    v-if="hasMissingItems(node)"
                    class="story-table-detail-button story-table-missing-button"
                    type="button"
                    :aria-label="`查看${node.title}待补充内容，共${node.missingItems.length}项`"
                    @click.stop="openMissingItems(node)"
                  >
                    待补充（{{ node.missingItems.length }}）
                  </button>
                </th>
                <td>
                  <span v-if="node.displayStatus" class="story-node-status" :class="getStatusClass(node.displayStatus)">{{ node.displayStatus }}</span>
                  <span
                    v-if="shouldDisplayTemplateStatus(node)"
                    class="story-node-template-status story-table-template-status"
                  >旧版未模板化</span>
                  <span v-if="!node.displayStatus && !shouldDisplayTemplateStatus(node)" class="story-table-empty">-</span>
                </td>
                <td>
                  <div class="story-table-tags">
                    <span v-for="storyTag in node.storyTags" :key="storyTag" class="story-node-story-tag">{{ storyTag }}</span>
                    <span
                      v-for="label in node.restraintRagLabels"
                      :key="`rag-${label}`"
                      class="story-node-restraint-rag-tag"
                    >{{ label }}</span>
                    <span
                      v-if="!node.storyTags.length && !node.restraintRagLabels.length"
                      class="story-table-empty"
                    >-</span>
                  </div>
                </td>
                <td class="story-table-summary">{{ node.summary }}</td>
                <td class="story-summary-copy-cell">{{ node.plotRefsText || '-' }}</td>
                <td class="story-summary-copy-cell">
                  <div class="story-table-tags">
                    <span
                      v-for="label in node.restraintRagLabels"
                      :key="`table-rag-${label}`"
                      class="story-node-restraint-rag-tag"
                    >{{ label }}</span>
                    <span v-if="!node.restraintRagLabels.length" class="story-table-empty">-</span>
                  </div>
                </td>
                <td class="story-summary-copy-cell">{{ node.ragRefsText || '-' }}</td>
                <td class="story-summary-copy-cell">{{ node.gameplayRefsText || '-' }}</td>
                <td class="story-summary-copy-cell">{{ node.charactersText || '-' }}</td>
                <td class="story-summary-copy-cell">{{ node.locationsText || '-' }}</td>
                <td class="story-summary-copy-cell">{{ node.requiredAbilitiesText || '-' }}</td>
                <td class="story-summary-copy-cell">{{ node.foreshadowingText || '-' }}</td>
                <td class="story-table-parent">{{ node.parentTitle || '-' }}</td>
                <td class="story-table-child">
                  <span class="story-table-title">{{ node.title }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div v-else class="story-table-panel" aria-label="故事元信息汇总">
        <header class="story-table-panel-header">
          <h2 class="story-table-panel-title">故事元信息汇总</h2>
        </header>
        <div class="story-table-viewport" role="region" aria-label="故事元信息汇总内容">
          <table class="story-table story-summary-table">
            <thead>
              <tr>
                <th scope="col" class="story-summary-category-heading">类别</th>
                <th
                  v-for="field in SUMMARY_FIELD_DEFINITIONS"
                  :key="field.key"
                  scope="col"
                  :class="getSummaryMatchFieldClass(field.key)"
                >
                  <div class="story-summary-search">
                    <span class="story-summary-search__label">{{ field.label }}</span>
                    <label class="story-summary-search__control">
                      <input
                        v-model="summarySearchQueries[field.key]"
                        class="story-summary-search__input"
                        type="search"
                        :aria-label="`搜索${field.label}`"
                        placeholder="搜索"
                      />
                      <button
                        v-if="getSummarySearchQuery(field.key)"
                        class="story-summary-search__clear"
                        type="button"
                        :aria-label="`清除${field.label}搜索`"
                        @click="clearSummarySearch(field.key)"
                      >
                        ×
                      </button>
                    </label>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="group in filteredSummaryGroups"
                :key="group.key"
                class="story-table-row-depth-0"
              >
                <th scope="row" class="story-summary-category">{{ group.title }}</th>
                <td
                  v-for="field in group.fields"
                  :key="field.key"
                  class="story-summary-values-cell"
                >
                  <div class="story-summary-values">
                    <button
                      v-for="item in field.filteredItems"
                      :key="item.value"
                      class="story-summary-value"
                      type="button"
                      :aria-label="`查看${group.title}中${field.label}为${item.value}的条目`"
                      @click="openSummaryMatches(group, field, item)"
                    >
                      <span
                        v-for="(part, index) in getSummarySearchHighlightedParts(field.key, item.value)"
                        :key="`${field.key}-${item.value}-${index}`"
                        :class="{ 'story-summary-search-keyword': part.isMatch }"
                      >
                        {{ part.text }}
                      </span>
                      （{{ item.count }}）
                    </button>
                    <span v-if="field.filteredItems.length === 0" class="story-table-empty">
                      {{ hasActiveSummarySearch() ? '无匹配' : '-' }}
                    </span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <div
      v-if="activeMissingNode"
      class="story-detail-overlay"
      role="presentation"
      @click.self="closeMissingItems"
    >
      <section
        ref="missingDialogRef"
        class="story-detail-dialog story-missing-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="story-missing-dialog-title"
        tabindex="-1"
        @keydown.esc.stop.prevent="closeMissingItems"
      >
        <header class="story-detail-header">
          <div class="story-detail-heading">
            <span class="story-node-status story-missing-status">待补充</span>
            <h2 id="story-missing-dialog-title" class="story-detail-title">{{ activeMissingNode.title }}</h2>
          </div>
          <button class="story-detail-close" type="button" aria-label="关闭待补充内容" @click="closeMissingItems">×</button>
        </header>
        <div class="story-detail-content" role="region" :aria-label="`${activeMissingNode.title}待补充内容`">
          <p class="story-missing-intro">该条目仍需补充以下已确认内容：</p>
          <ol class="story-missing-list">
            <li
              v-for="(item, index) in activeMissingItems"
              :key="`${activeMissingNode.key}-missing-${index}`"
              :class="{ 'story-missing-item-ready': item.isReady }"
            >
              <strong>{{ item.type }}</strong>
              <span class="story-missing-module">{{ item.module }}</span>
              <p>{{ item.detail }}</p>
            </li>
          </ol>
        </div>
      </section>
    </div>

    <div
      v-if="activeDetailNode"
      class="story-detail-overlay"
      role="presentation"
      @click.self="closeDetail"
    >
      <section
        ref="detailDialogRef"
        class="story-detail-dialog"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="detailTitleId"
        tabindex="-1"
        @keydown.esc.stop.prevent="closeDetail"
      >
        <header class="story-detail-header">
          <div class="story-detail-heading">
            <span v-if="activeDetailNode.displayStatus" class="story-node-status" :class="getStatusClass(activeDetailNode.displayStatus)">
              {{ activeDetailNode.displayStatus }}
            </span>
            <h2 :id="detailTitleId" class="story-detail-title">{{ activeDetailNode.title }}</h2>
          </div>
          <button
            class="story-detail-close"
            type="button"
            aria-label="关闭故事详情"
            @click="closeDetail"
          >
            ×
          </button>
        </header>
        <div class="story-detail-content" role="region" :aria-label="`${activeDetailNode.title}正文`">
          <div class="story-detail-text">
            <template
              v-for="(block, index) in activeDetailBlocks"
              :key="`${activeDetailNode.key || activeDetailNode.title}-detail-${index}`"
            >
              <figure v-if="block.type === 'image'" class="story-detail-figure">
                <img
                  class="story-detail-image"
                  :src="block.src"
                  :alt="block.alt"
                  loading="lazy"
                />
                <figcaption v-if="block.alt" class="story-detail-caption">{{ block.alt }}</figcaption>
              </figure>
              <component
                :is="`h${block.level}`"
                v-else-if="block.type === 'heading'"
                class="story-detail-heading-block"
              >
                {{ block.text }}
              </component>
              <ol v-else-if="block.type === 'list' && block.ordered" class="story-detail-list story-detail-list-ordered">
                <li v-for="(item, itemIndex) in block.items" :key="`${index}-ordered-${itemIndex}`">
                  {{ item }}
                </li>
              </ol>
              <ul v-else-if="block.type === 'list'" class="story-detail-list">
                <li v-for="(item, itemIndex) in block.items" :key="`${index}-unordered-${itemIndex}`">
                  {{ item }}
                </li>
              </ul>
              <blockquote v-else-if="block.type === 'quote'" class="story-detail-quote">
                {{ block.text }}
              </blockquote>
              <p v-else class="story-detail-paragraph">
                {{ block.text }}
              </p>
            </template>
            <p v-if="activeDetailBlocks.length === 0" class="story-detail-paragraph">
              正文待补。
            </p>
          </div>
        </div>
      </section>
    </div>

    <div
      v-if="activeCgNode"
      class="story-detail-overlay"
      role="presentation"
      @click.self="closeStoryCg"
    >
      <section
        ref="cgDialogRef"
        class="story-detail-dialog story-cg-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="story-cg-dialog-title"
        tabindex="-1"
        @keydown.esc.stop.prevent="closeStoryCg"
      >
        <header class="story-detail-header">
          <div class="story-detail-heading">
            <span class="story-node-status">关联 CG</span>
            <h2 id="story-cg-dialog-title" class="story-detail-title">{{ activeCgNode.title }}</h2>
          </div>
          <button class="story-detail-close" type="button" aria-label="关闭关联CG" @click="closeStoryCg">×</button>
        </header>
        <div class="story-detail-content" role="region" :aria-label="`${activeCgNode.title}关联CG条目`">
          <div class="story-cg-grid">
            <article v-for="entry in activeStoryCgEntries" :key="entry.key" class="story-cg-entry">
              <header class="story-cg-entry-header">
                <div>
                  <span class="story-cg-sequence-index">CG {{ entry.sequenceIndex }}</span>
                  <h3>{{ entry.title }}</h3>
                </div>
                <span>{{ entry.summary }}</span>
              </header>
              <dl v-if="entry.timing || entry.content" class="story-cg-description">
                <template v-if="entry.timing">
                  <dt>出现时机</dt>
                  <dd>{{ entry.timing }}</dd>
                </template>
                <template v-if="entry.content">
                  <dt>具体画面</dt>
                  <dd>{{ entry.content }}</dd>
                </template>
              </dl>
              <button
                v-if="getStoryCgCover(entry)"
                class="story-cg-cover"
                type="button"
                :aria-label="`查看${entry.title}大图与差分`"
                @click="openStoryCgPreview(entry)"
              >
                <img :src="getStoryCgCover(entry).image" :alt="`${entry.title}封面`" loading="lazy" />
                <span>点击查看大图<span v-if="entry.variants.length > 1"> · {{ entry.variants.length }} 个差分</span></span>
              </button>
            </article>
          </div>
        </div>
      </section>
    </div>

    <div
      v-if="activeStoryCgPreview"
      class="story-detail-overlay story-cg-preview-overlay"
      role="presentation"
      @click.self="closeStoryCgPreview"
    >
      <section
        ref="cgPreviewDialogRef"
        class="story-detail-dialog story-cg-preview-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="story-cg-preview-title"
        tabindex="-1"
        @keydown.esc.stop.prevent="closeStoryCgPreview"
      >
        <header class="story-detail-header">
          <div class="story-detail-heading">
            <span class="story-node-status">CG 大图</span>
            <h2 id="story-cg-preview-title" class="story-detail-title">{{ activeStoryCgPreview.title }}</h2>
          </div>
          <button class="story-detail-close" type="button" aria-label="关闭CG大图" @click="closeStoryCgPreview">×</button>
        </header>
        <div class="story-cg-preview-content">
          <img
            :src="activeStoryCgVariant.image"
            :alt="`${activeStoryCgPreview.title} ${activeStoryCgVariant.label}`"
          />
          <div v-if="activeStoryCgPreview.variants.length > 1" class="story-cg-preview-switcher" aria-label="切换CG差分">
            <button
              v-for="(variant, index) in activeStoryCgPreview.variants"
              :key="variant.key || variant.image"
              type="button"
              :class="{ active: index === activeStoryCgPreview.activeVariantIndex }"
              :aria-pressed="index === activeStoryCgPreview.activeVariantIndex"
              @click="selectStoryCgVariant(index)"
            >
              {{ variant.label }}
            </button>
          </div>
        </div>
      </section>
    </div>

    <div
      v-if="activeSummaryFilter"
      class="story-detail-overlay"
      role="presentation"
      @click.self="closeSummaryMatches"
    >
      <section
        class="story-detail-dialog story-summary-match-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="story-summary-match-title"
        tabindex="-1"
        @keydown.esc.stop.prevent="closeSummaryMatches"
      >
        <header class="story-detail-header">
          <div class="story-detail-heading">
            <span class="story-node-status story-node-status-category">{{ activeSummaryFilter.groupTitle }}</span>
            <h2 id="story-summary-match-title" class="story-detail-title">
              {{ activeSummaryFilter.fieldLabel }}：{{ activeSummaryFilter.value }}
            </h2>
          </div>
          <button
            class="story-detail-close"
            type="button"
            aria-label="关闭匹配条目表格"
            @click="closeSummaryMatches"
          >
            ×
          </button>
        </header>
        <div class="story-detail-content story-summary-match-content" role="region" :aria-label="`${activeSummaryFilter.value}匹配条目`">
          <table class="story-table story-summary-match-table">
            <thead>
              <tr>
                <th scope="col">文件名</th>
                <th scope="col">状态</th>
                <th scope="col" :class="getSummaryMatchFieldClass('plotRefs')">情节引用</th>
                <th scope="col" :class="getSummaryMatchFieldClass('ragRefs')">紧缚 RAG 引用</th>
                <th scope="col" :class="getSummaryMatchFieldClass('gameplayRefs')">玩法引用</th>
                <th scope="col">简介</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="node in activeSummaryFilter.nodes"
                :key="node.key || node.path"
              >
                <th scope="row" class="story-table-node-title">
                  <template v-if="node.fileTitle">
                    <span
                      v-for="(part, index) in getSummaryMatchHighlightedParts(node.fileTitle)"
                      :key="`${node.key || node.fileTitle}-file-title-${index}`"
                      :class="{ 'story-summary-match-keyword': part.isMatch }"
                    >
                      {{ part.text }}
                    </span>
                  </template>
                  <span v-else>-</span>
                </th>
                <td class="story-summary-copy-cell">
                  <template v-if="node.status">
                    <span
                      v-for="(part, index) in getSummaryMatchHighlightedParts(node.status)"
                      :key="`${node.key || node.fileTitle}-status-${index}`"
                      :class="{ 'story-summary-match-keyword': part.isMatch }"
                    >
                      {{ part.text }}
                    </span>
                  </template>
                  <span v-else>-</span>
                </td>
                <td class="story-summary-copy-cell">
                  <template v-if="node.plotRefsText">
                    <span
                      v-for="(part, index) in getSummaryMatchHighlightedParts(node.plotRefsText)"
                      :key="`${node.key || node.fileTitle}-plot-refs-${index}`"
                      :class="{ 'story-summary-match-keyword': part.isMatch }"
                    >
                      {{ part.text }}
                    </span>
                  </template>
                  <span v-else>-</span>
                </td>
                <td class="story-summary-copy-cell">
                  <template v-if="node.ragRefsText">
                    <span
                      v-for="(part, index) in getSummaryMatchHighlightedParts(node.ragRefsText)"
                      :key="`${node.key || node.fileTitle}-rag-refs-${index}`"
                      :class="{ 'story-summary-match-keyword': part.isMatch }"
                    >
                      {{ part.text }}
                    </span>
                  </template>
                  <span v-else>-</span>
                </td>
                <td class="story-summary-copy-cell">
                  <template v-if="node.gameplayRefsText">
                    <span
                      v-for="(part, index) in getSummaryMatchHighlightedParts(node.gameplayRefsText)"
                      :key="`${node.key || node.fileTitle}-gameplay-refs-${index}`"
                      :class="{ 'story-summary-match-keyword': part.isMatch }"
                    >
                      {{ part.text }}
                    </span>
                  </template>
                  <span v-else>-</span>
                </td>
                <td class="story-table-summary">
                  <template v-if="node.summary">
                    <span
                      v-for="(part, index) in getSummaryMatchHighlightedParts(node.summary)"
                      :key="`${node.key || node.fileTitle}-summary-${index}`"
                      :class="{ 'story-summary-match-keyword': part.isMatch }"
                    >
                      {{ part.text }}
                    </span>
                  </template>
                  <span v-else>-</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>

    <StoryGameplayLinkDialog
      v-if="activeGameplayNode"
      :node="activeGameplayNode"
      :catalog="gameplayCatalog"
      @close="closeGameplayLinks"
      @view-gameplay="viewGameplay"
    />
  </section>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import {
  createAllStoryExportPayload,
  createCategoryExportPayload,
  findOutlineNodeByKey,
  sanitizeStoryExportFilename
} from '../../../data/story_outline/storyOutlineExport';
import { createStoryCgPreview, resolveStoryCgSequence } from '../../../data/story_outline/storyCgLinks';
import {
  resolveStoryGameplayLinks,
  resolveStoryGameplayTitles
} from '../../../data/gameplay_outline/gameplayOutline';
import { codexCategories } from '../../../data/global/gameMenuData';
import { downloadJsonPayload } from './jsonDownload';
import StoryGameplayLinkDialog from './StoryGameplayLinkDialog.vue';
import { shouldOpenMetaPopoverRight } from './storyMetaPopover';
import {
  indexRagCardsById,
  resolveRestraintRagPrimaryLabels
} from '../../../data/outline_relation_graph/resolveRestraintRagPrimaryLabels.js';
import { listBundledRagCards } from '../../../data/outline_relation_graph/loadOutlineRelationGraph.js';

const detailImageModules = import.meta.glob([
  '../../../../assets/game/outlines/**/*.{png,jpg,jpeg,webp,gif}',
  '../../../../assets/game/cg/*.{png,jpg,jpeg,webp,gif}'
], {
  eager: true,
  query: '?url',
  import: 'default'
});
const detailImageUrlByPath = createDetailImageUrlMap(detailImageModules);
const storyCgSlots = codexCategories.find((category) => category.key === 'cg')?.slots ?? [];
const restraintRagCardIndex = indexRagCardsById(listBundledRagCards());

const props = defineProps({
  outline: {
    type: Array,
    default: () => []
  },
  gameplayCatalog: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['view-gameplay']);

const NODE_WIDTH = 220;
const NODE_MIN_HEIGHT = 126;
const COLUMN_GAP = 264;
const VERTICAL_COLUMN_GAP = 228;
const NODE_TRACK_GAP = 24;
const CANVAS_PADDING = 96;
const ROOT_BRANCH_GAP = 0.12;
const SIDE_BRANCH_ROW_OFFSET = 1.24;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 1.7;
const ZOOM_STEP = 0.1;

const viewportRef = ref(null);
const detailDialogRef = ref(null);
const missingDialogRef = ref(null);
const cgDialogRef = ref(null);
const cgPreviewDialogRef = ref(null);
const zoom = ref(0.88);
const isDragging = ref(false);
const dragState = ref(null);
const layoutMode = ref('vertical');
const collapsedCategoryKeys = ref(new Set());
const activeDetailNode = ref(null);
const activeMissingNode = ref(null);
const activeCgNode = ref(null);
const activeStoryCgPreview = ref(null);
const activeSummaryFilter = ref(null);
const activeGameplayNode = ref(null);
const summarySearchQueries = ref({});
const detailTitleId = 'story-detail-title';
const layoutModeOptions = [
  {
    key: 'vertical',
    label: '纵向'
  },
  {
    key: 'horizontal',
    label: '横向'
  },
  {
    key: 'table',
    label: '表格'
  },
  {
    key: 'summary',
    label: '汇总'
  }
];

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const SUMMARY_FIELD_DEFINITIONS = [
  {
    key: 'plotRefs',
    label: '情节引用'
  },
  {
    key: 'storyTags',
    label: 'storyTags'
  },
  {
    key: 'ragRefs',
    label: '紧缚 RAG 引用'
  },
  {
    key: 'gameplayRefs',
    label: '玩法引用'
  },
  {
    key: 'characters',
    label: 'characters'
  },
  {
    key: 'locations',
    label: 'locations'
  },
  {
    key: 'requiredAbilities',
    label: 'requiredAbilities'
  },
  {
    key: 'foreshadowing',
    label: 'foreshadowing'
  }
];

function unique(values) {
  return values.filter((value, index) => value && values.indexOf(value) === index);
}

function getStoryTags(node) {
  return unique(Array.isArray(node.storyTags) ? node.storyTags : []).slice(0, 2);
}

function getRestraintRagLabels(node) {
  return resolveRestraintRagPrimaryLabels(node?.ragRefs, restraintRagCardIndex).slice(0, 4);
}

function getDetailLabel(node) {
  return String(node.detailLabel ?? '').trim() || '大纲';
}

function hasStoryDetail(node) {
  return Boolean(node?.detailMarkdown || node?.detailSourcePath);
}

function getStoryCgEntries(node) {
  return resolveStoryCgSequence(node?.cgRefs, node?.cgSequence, storyCgSlots);
}

function hasStoryCg(node) {
  return getStoryCgEntries(node).length > 0;
}

function formatMetaValue(value) {
  if (Array.isArray(value)) {
    return value.filter(Boolean).join('、');
  }

  return value || '';
}

function createMetaItem(label, value) {
  const formattedValue = formatMetaValue(value);

  return formattedValue
    ? {
        label,
        value: formattedValue
      }
    : null;
}

function toValueList(value) {
  if (Array.isArray(value)) {
    return unique(value.map((item) => String(item ?? '').trim()).filter(Boolean));
  }

  const scalarValue = String(value ?? '').trim();
  return scalarValue ? [scalarValue] : [];
}

function formatSummaryValue(value) {
  return toValueList(value).join('、');
}

function hasSummaryFields(node) {
  return [
    node.storyTags,
    node.plotRefs,
    node.ragRefs,
    node.gameplayRefs,
    node.characters,
    node.locations,
    node.requiredAbilities,
    node.foreshadowing
  ].some((value) => toValueList(value).length > 0);
}

function hasNodeMetaRow(node) {
  return Boolean(
    node.displayStatus ||
      shouldDisplayTemplateStatus(node) ||
      node.storyTags.length > 0 ||
      (Array.isArray(node.restraintRagLabels) && node.restraintRagLabels.length > 0) ||
      node.timeline
  );
}

function shouldDisplayTemplateStatus(node) {
  return node.showsTemplateStatus && !node.isTemplated;
}

function shouldShowTemplateStatus(status) {
  return !isCategoryStatus(status) && !isMainQuestStatus(status) && status !== '收回';
}

function hasMissingItems(node) {
  return Array.isArray(node?.missingItems) && node.missingItems.length > 0;
}

function parseMissingItem(value) {
  const [type = '其他', module = '未标明模块', ...detailParts] = String(value ?? '').split('｜');
  return {
    type: type.trim() || '其他',
    module: module.trim() || '未标明模块',
    detail: detailParts.join('｜').trim() || '具体缺失内容未说明',
    isReady: type.trim() === '可制作'
  };
}

function updateMetaPopoverDirection(event) {
  const flag = event.currentTarget;
  const popover = flag?.querySelector('.story-node-meta-popover');

  if (!flag || !popover) {
    return;
  }

  const viewportRect = viewportRef.value?.getBoundingClientRect();
  const boundaryRect = {
    left: Math.max(0, viewportRect?.left ?? 0),
    right: Math.min(window.innerWidth, viewportRect?.right ?? window.innerWidth)
  };
  const openRight = shouldOpenMetaPopoverRight(
    flag.getBoundingClientRect(),
    boundaryRect,
    popover.getBoundingClientRect().width
  );

  flag.classList.toggle('story-node-meta-flag-open-right', openRight);
}

function getLinkedGameplay(node) {
  return resolveStoryGameplayLinks(node, props.gameplayCatalog ?? undefined);
}

function hasLinkedGameplay(node) {
  return getLinkedGameplay(node).length > 0;
}

function openGameplayLinks(node) {
  activeGameplayNode.value = node;
}

function closeGameplayLinks() {
  activeGameplayNode.value = null;
}

function isVirtualStoryNode(node) {
  return isCategoryStatus(node?.status) || isMainQuestStatus(node?.status) || isRegionGroupStatus(node?.status);
}

function getMetaItems(node) {
  if (isMainQuestStatus(node?.status)) {
    return [
      createMetaItem('文件', getMarkdownFileTitle(node.detailSourcePath))
    ].filter(Boolean);
  }

  if (isVirtualStoryNode(node)) {
    return [];
  }

  return [
    createMetaItem('世界', node.world),
    createMetaItem('简介', node.summary),
    createMetaItem('伏笔', node.foreshadowing),
    createMetaItem('情节引用', node.plotRefs),
    createMetaItem('紧缚 RAG', getRestraintRagLabels(node)),
    createMetaItem('紧缚 RAG 引用', node.ragRefs),
    createMetaItem('玩法引用', node.gameplayRefs),
    createMetaItem('主要角色', node.characters),
    createMetaItem('需要异能', node.requiredAbilities),
    createMetaItem('所在地点', node.locations),
    createMetaItem('参考', node.reference),
    createMetaItem('文件', getMarkdownFileTitle(node.detailSourcePath))
  ].filter(Boolean);
}

function getMarkdownFileTitle(sourcePath) {
  const normalizedPath = String(sourcePath ?? '').replace(/\\/g, '/').trim();
  const filename = normalizedPath.split('/').pop() ?? '';

  return filename.replace(/\.md$/i, '').trim();
}

function isCategoryStatus(status) {
  return status === '分类';
}

function isMainQuestStatus(status) {
  return status === '主线任务';
}

function isMainQuestNode(node) {
  return node?.questType === 'main' || isMainQuestStatus(node?.status);
}

function isSideQuestStatus(status) {
  return status === '支线任务';
}

function isRegionGroupStatus(status) {
  return status === '区域组';
}

function isRegionStatus(status) {
  return status === '区域';
}

function isRegionStatusLike(status) {
  return isRegionGroupStatus(status) || isRegionStatus(status);
}

function getDisplayStatus(status) {
  return isCategoryStatus(status) || isMainQuestStatus(status) || isRegionStatusLike(status) ? status : '';
}

function isCollapsibleStatus(status) {
  return ['分类', '主线任务', '支线任务'].includes(status);
}

function isSideBranchNode(node) {
  return node.branchLayout === 'side';
}

function getChildDepth(parentDepth) {
  return parentDepth + 1;
}

function getStatusClass(status) {
  if (isMainQuestStatus(status) || isRegionGroupStatus(status)) {
    return 'story-node-status-main-quest';
  }

  if (isRegionStatus(status)) {
    return 'story-node-status-progress';
  }

  if (isSideQuestStatus(status)) {
    return 'story-node-status-side-quest';
  }

  return isCategoryStatus(status) ? 'story-node-status-category' : 'story-node-status-progress';
}

function getNodeCardClass(node) {
  if (isMainQuestStatus(node.status) || isRegionGroupStatus(node.status)) {
    return 'story-node-card-main-quest';
  }

  if (isRegionStatus(node.status)) {
    return 'story-node-card-progress';
  }

  if (node.isSideBranchLine || isSideBranchNode(node)) {
    return 'story-node-card-side-quest';
  }

  if (isSideQuestStatus(node.status)) {
    return 'story-node-card-side-quest';
  }

  if (isRegionStatusLike(node.status)) {
    return 'story-node-card-category';
  }

  return isCategoryStatus(node.status) ? 'story-node-card-category' : 'story-node-card-progress';
}

function getLayoutNodeHeight(node) {
  if (node?.isCollapsedPreview) {
    return NODE_MIN_HEIGHT;
  }

  const hasActions = isCategoryStatus(node?.status)
    || node?.metaItems?.length > 0
    || hasStoryDetail(node)
    || hasLinkedGameplay(node);
  const titleRows = String(node?.title ?? '').length > 16 ? 2 : 1;
  const tagRows = 0;
  const summaryRows = node?.summary
    ? isCategoryStatus(node?.status)
      ? Math.max(1, Math.ceil(String(node.summary).length / 24))
      : 2
    : 0;
  const contentHeight = 24
    + (hasActions ? 28 : 0)
    + titleRows * 20
    + summaryRows * 17
    + (summaryRows ? 7 : 0)
    + tagRows * 20
    + (hasNodeMetaRow(node) ? 28 : 0);

  return Math.max(NODE_MIN_HEIGHT, contentHeight);
}

function applyFixedTrackSpacing(nodes, isVertical) {
  const getTrackKey = isVertical ? (node) => node.depth : (node) => node.row;
  const trackHeights = new Map();

  nodes.forEach((node) => {
    node.layoutHeight = getLayoutNodeHeight(node);
    const trackKey = getTrackKey(node);
    trackHeights.set(trackKey, Math.max(trackHeights.get(trackKey) ?? 0, node.layoutHeight));
  });

  const trackOffsets = new Map();
  let offset = CANVAS_PADDING;
  [...trackHeights.keys()].sort((left, right) => left - right).forEach((trackKey) => {
    trackOffsets.set(trackKey, offset);
    offset += trackHeights.get(trackKey) + NODE_TRACK_GAP;
  });

  nodes.forEach((node) => {
    node.y = trackOffsets.get(getTrackKey(node));
  });
}

function countDescendantNodes(node) {
  const children = Array.isArray(node.children) ? node.children : [];

  return children.reduce((count, child) => count + 1 + countDescendantNodes(child), 0);
}

function findNextMainQuestNode(node) {
  const children = Array.isArray(node.children) ? node.children : [];

  for (const child of children) {
    if (isMainQuestNode(child)) {
      return child;
    }

    const nestedMainQuestNode = findNextMainQuestNode(child);

    if (nestedMainQuestNode) {
      return nestedMainQuestNode;
    }
  }

  return null;
}

function countNodesBeforeNextMainQuest(node) {
  const children = Array.isArray(node.children) ? node.children : [];
  let count = 0;

  for (const child of children) {
    if (isMainQuestNode(child)) {
      return {
        count,
        hasBoundary: true
      };
    }

    const nestedResult = countNodesBeforeNextMainQuest(child);
    count += 1 + nestedResult.count;

    if (nestedResult.hasBoundary) {
      return {
        count,
        hasBoundary: true
      };
    }
  }

  return {
    count,
    hasBoundary: false
  };
}

function getCollapsedDescendantCount(node) {
  if (!isMainQuestNode(node)) {
    return countDescendantNodes(node);
  }

  const boundaryResult = countNodesBeforeNextMainQuest(node);

  return boundaryResult.hasBoundary ? boundaryResult.count : countDescendantNodes(node);
}

function countBranchDepth(node) {
  const children = Array.isArray(node.children) ? node.children : [];

  if (children.length === 0) {
    return 1;
  }

  return 1 + Math.max(...children.map(countBranchDepth));
}

function countBranchStackDepth(nodes) {
  return nodes.reduce((depthCount, node) => depthCount + Math.max(1, countBranchDepth(node)), 0);
}

function hasSideBranchChild(node) {
  const children = Array.isArray(node.children) ? node.children : [];

  return children.some(isSideBranchNode);
}

function isCategoryCollapsed(key) {
  return collapsedCategoryKeys.value.has(key);
}

function toggleCategoryNode(key) {
  const nextCollapsedKeys = new Set(collapsedCategoryKeys.value);

  if (nextCollapsedKeys.has(key)) {
    nextCollapsedKeys.delete(key);
  } else {
    nextCollapsedKeys.add(key);
  }

  collapsedCategoryKeys.value = nextCollapsedKeys;
}

function exportAllStoryJson(includeMarkdown) {
  const payload = createAllStoryExportPayload(props.outline, { includeMarkdown });
  const fileSuffix = includeMarkdown ? 'full' : 'summary';

  downloadJsonPayload(payload, `liluo-story-outline-${fileSuffix}.json`);
}

function exportCategoryJson(layoutNode) {
  const categoryNode = findOutlineNodeByKey(props.outline, layoutNode.key);

  if (!categoryNode) {
    return;
  }

  const payload = createCategoryExportPayload(categoryNode);
  downloadJsonPayload(payload, `${sanitizeStoryExportFilename(categoryNode.title || categoryNode.key || 'story-category')}.json`);
}

function openDetail(node) {
  activeDetailNode.value = node;
}

function openMissingItems(node) {
  activeMissingNode.value = node;
}

function closeMissingItems() {
  activeMissingNode.value = null;
}

function closeDetail() {
  activeDetailNode.value = null;
}

function openStoryCg(node) {
  activeCgNode.value = node;
}

function closeStoryCg() {
  closeStoryCgPreview();
  activeCgNode.value = null;
}

function getStoryCgCover(entry) {
  return entry?.variants?.find((variant) => variant?.image) ?? null;
}

function openStoryCgPreview(entry) {
  activeStoryCgPreview.value = createStoryCgPreview(entry);
}

function closeStoryCgPreview() {
  activeStoryCgPreview.value = null;
}

function selectStoryCgVariant(index) {
  if (!activeStoryCgPreview.value?.variants[index]) {
    return;
  }

  activeStoryCgPreview.value.activeVariantIndex = index;
}

function viewGameplay(gameplayId) {
  closeGameplayLinks();
  emit('view-gameplay', gameplayId);
}

function handleDocumentKeydown(event) {
  if (event.key === 'Escape' && activeStoryCgPreview.value) {
    closeStoryCgPreview();
  } else if (event.key === 'Escape' && activeDetailNode.value) {
    closeDetail();
  } else if (event.key === 'Escape' && activeCgNode.value) {
    closeStoryCg();
  } else if (event.key === 'Escape' && activeSummaryFilter.value) {
    closeSummaryMatches();
  } else if (event.key === 'Escape' && activeMissingNode.value) {
    closeMissingItems();
  }
}

function getCollapseLabel(node) {
  return `${node.isCollapsed ? '展开' : '收回'}${node.title}`;
}

function createTableRows(outline, collapsedKeys) {
  const rows = [];

  function walk(node, depth, parentTitle = '') {
    const children = Array.isArray(node.children) ? node.children : [];
    const canCollapse = isCollapsibleStatus(node.status) && children.length > 0;
    const isCollapsed = canCollapse && collapsedKeys.has(node.key);
    const nextMainQuestNode = isCollapsed && isMainQuestNode(node) ? findNextMainQuestNode(node) : null;

    rows.push({
      key: node.key,
      parentTitle,
      title: node.title,
      summary: node.summary,
      status: node.status,
      displayStatus: getDisplayStatus(node.status),
      detailMarkdown: node.detailMarkdown,
      detailSourcePath: node.detailSourcePath,
      detailLabel: getDetailLabel(node),
      isTemplated: node.isTemplated === true,
      showsTemplateStatus: shouldShowTemplateStatus(node.status),
      missingItems: Array.isArray(node.missingItems) ? node.missingItems : [],
      cgRefs: Array.isArray(node.cgRefs) ? node.cgRefs : [],
      cgSequence: Array.isArray(node.cgSequence) ? node.cgSequence : [],
      gameplayRefs: Array.isArray(node.gameplayRefs) ? node.gameplayRefs : [],
      storyTags: getStoryTags(node),
      restraintRagLabels: getRestraintRagLabels(node),
      plotRefsText: formatSummaryValue(node.plotRefs),
      ragRefsText: formatSummaryValue(node.ragRefs),
      gameplayRefsText: formatSummaryValue(node.gameplayRefs),
      charactersText: formatSummaryValue(node.characters),
      locationsText: formatSummaryValue(node.locations),
      requiredAbilitiesText: formatSummaryValue(node.requiredAbilities),
      foreshadowingText: formatSummaryValue(node.foreshadowing),
      metaItems: getMetaItems(node),
      depth,
      canCollapse,
      isCollapsed
    });

    if (!isCollapsed) {
      children.forEach((child) => walk(child, getChildDepth(depth), node.title));
    } else if (nextMainQuestNode) {
      walk(nextMainQuestNode, getChildDepth(depth), node.title);
    }
  }

  outline.forEach((rootNode) => walk(rootNode, 0));
  return rows;
}

function createSummaryGroups(outline) {
  return outline
    .map((rootNode) => {
      const categoryTitle = rootNode.title || '未分类';
      const nodes = [];

      function walk(node) {
        nodes.push({
          ...node,
          primaryGameplay: resolveStoryGameplayTitles(node, props.gameplayCatalog ?? undefined)
        });
        const children = Array.isArray(node.children) ? node.children : [];
        children.forEach(walk);
      }

      walk(rootNode);

      return {
        key: rootNode.key || categoryTitle,
        title: categoryTitle,
        nodes,
        fields: createSummaryFields(nodes)
      };
    })
    .filter((group) => group.fields.some((field) => field.items.length > 0));
}

function createSummaryFields(nodes) {
  const fieldCounters = new Map(
    SUMMARY_FIELD_DEFINITIONS.map((field) => [field.key, new Map()])
  );

  nodes.forEach((node) => {
    SUMMARY_FIELD_DEFINITIONS.forEach((field) => {
      const counter = fieldCounters.get(field.key);
      toValueList(node[field.key]).forEach((value) => {
        if (!counter.has(value)) {
          counter.set(value, {
            count: 0,
            nodes: []
          });
        }

        const entry = counter.get(value);
        entry.count += 1;
        entry.nodes.push(createSummaryMatchNode(node));
      });
    });
  });

  return SUMMARY_FIELD_DEFINITIONS.map((field) => {
    const counter = fieldCounters.get(field.key);
    const items = [...counter.entries()]
      .map(([value, entry]) => ({
        value,
        count: entry.count,
        nodes: entry.nodes
      }))
      .sort((left, right) => right.count - left.count || left.value.localeCompare(right.value, 'zh-Hans-CN'));

    return {
      key: field.key,
      label: field.label,
      uniqueCount: items.length,
      entryCount: items.reduce((count, item) => count + item.count, 0),
      items,
      filteredItems: items
    };
  });
}

function getSummarySearchQuery(fieldKey) {
  return String(summarySearchQueries.value[fieldKey] ?? '').trim();
}

function clearSummarySearch(fieldKey) {
  summarySearchQueries.value[fieldKey] = '';
}

function hasActiveSummarySearch() {
  return SUMMARY_FIELD_DEFINITIONS.some((field) => getSummarySearchQuery(field.key));
}

function getFuzzySearchChars(query) {
  return Array.from(String(query ?? '').trim().toLocaleLowerCase())
    .filter((char) => char.trim());
}

function getFuzzyMatchIndexes(text, query) {
  const chars = getFuzzySearchChars(query);

  if (chars.length === 0) {
    return [];
  }

  const sourceChars = Array.from(String(text ?? ''));
  const normalizedSourceChars = sourceChars.map((char) => char.toLocaleLowerCase());
  const matchIndexes = [];
  let cursor = 0;

  for (const char of chars) {
    const matchIndex = normalizedSourceChars.indexOf(char, cursor);

    if (matchIndex === -1) {
      return null;
    }

    matchIndexes.push(matchIndex);
    cursor = matchIndex + 1;
  }

  return matchIndexes;
}

function matchesSummarySearch(value, query) {
  return !String(query ?? '').trim() || getFuzzyMatchIndexes(value, query) !== null;
}

function createFilteredSummaryGroups(groups) {
  const activeSearches = SUMMARY_FIELD_DEFINITIONS
    .map((field) => ({
      key: field.key,
      query: getSummarySearchQuery(field.key)
    }))
    .filter((search) => search.query);

  if (activeSearches.length === 0) {
    return groups.map((group) => ({
      ...group,
      fields: group.fields.map((field) => ({
        ...field,
        filteredItems: field.items
      }))
    }));
  }

  return groups.map((group) => {
    const filteredNodes = group.nodes.filter((node) => (
      activeSearches.every((search) => (
        toValueList(node[search.key]).some((value) => matchesSummarySearch(value, search.query))
      ))
    ));

    return {
      ...group,
      fields: createSummaryFields(filteredNodes)
    };
  });
}

function createSummaryMatchNode(node) {
  const fileTitle = getMarkdownFileTitle(node.detailSourcePath);
  const plotRefs = toValueList(node.plotRefs);
  const ragRefs = toValueList(node.ragRefs);
  const gameplayRefs = toValueList(node.gameplayRefs);

  return {
    key: node.key ?? '',
    title: node.title ?? '',
    status: node.status ?? '',
    summary: node.summary ?? '',
    detailSourcePath: node.detailSourcePath ?? '',
    fileTitle,
    plotRefsText: formatSummaryValue(plotRefs),
    ragRefsText: formatSummaryValue(ragRefs),
    gameplayRefsText: formatSummaryValue(gameplayRefs)
  };
}

function openSummaryMatches(group, field, item) {
  activeSummaryFilter.value = {
    groupTitle: group.title,
    fieldKey: field.key,
    fieldLabel: field.label,
    value: item.value,
    nodes: item.nodes
  };
}

function closeSummaryMatches() {
  activeSummaryFilter.value = null;
}

function getSummaryMatchFieldClass(fieldKey) {
  return activeSummaryFilter.value?.fieldKey === fieldKey
    ? 'story-summary-match-active-cell'
    : '';
}

function getSummaryMatchHighlightedParts(text) {
  const content = String(text ?? '');
  const keyword = String(activeSummaryFilter.value?.value ?? '').trim();

  if (!content || !keyword) {
    return content ? [{ text: content, isMatch: false }] : [];
  }

  const parts = [];
  let cursor = 0;
  let matchIndex = content.indexOf(keyword, cursor);

  while (matchIndex !== -1) {
    if (matchIndex > cursor) {
      parts.push({
        text: content.slice(cursor, matchIndex),
        isMatch: false
      });
    }

    parts.push({
      text: content.slice(matchIndex, matchIndex + keyword.length),
      isMatch: true
    });

    cursor = matchIndex + keyword.length;
    matchIndex = content.indexOf(keyword, cursor);
  }

  if (cursor < content.length) {
    parts.push({
      text: content.slice(cursor),
      isMatch: false
    });
  }

  return parts;
}

function getSummarySearchHighlightedParts(fieldKey, text) {
  const content = String(text ?? '');
  const query = getSummarySearchQuery(fieldKey);
  const matchIndexes = getFuzzyMatchIndexes(content, query);

  if (!content || !query || !matchIndexes) {
    return content ? [{ text: content, isMatch: false }] : [];
  }

  const matchedIndexSet = new Set(matchIndexes);
  const parts = [];

  Array.from(content).forEach((char, index) => {
    const isMatch = matchedIndexSet.has(index);
    const previousPart = parts[parts.length - 1];

    if (previousPart && previousPart.isMatch === isMatch) {
      previousPart.text += char;
      return;
    }

    parts.push({
      text: char,
      isMatch
    });
  });

  return parts;
}

function createNodeLayout(outline, mode, collapsedKeys) {
  const nodes = [];
  let rowCursor = 0;
  const isVertical = mode === 'vertical';

  function walk(node, depth, parentKey = '', fixedRow = null, isSideBranchLine = false) {
    const children = Array.isArray(node.children) ? node.children : [];
    const canCollapse = isCollapsibleStatus(node.status) && children.length > 0;
    const isCollapsed = canCollapse && collapsedKeys.has(node.key);
    const nextMainQuestNode = isCollapsed && isMainQuestNode(node) ? findNextMainQuestNode(node) : null;
    const visibleChildren = isCollapsed ? [] : children;
    const normalChildren = visibleChildren.filter((child) => !isSideBranchNode(child));
    const sideChildren = visibleChildren.filter(isSideBranchNode);
    const sideBranchStackDepth = isVertical && !isCollapsed ? countBranchStackDepth(sideChildren) : 0;
    const shouldExtendMainDepth = sideBranchStackDepth > 1 && normalChildren.some(hasSideBranchChild);
    const normalChildDepth = depth + (shouldExtendMainDepth ? sideBranchStackDepth : 1);
    const collapsedDescendantCount = isCollapsed ? getCollapsedDescendantCount(node) : 0;

    const previousRowCursor = rowCursor;

    if (fixedRow !== null) {
      rowCursor = fixedRow;
    }

    let childEntries = normalChildren.map((child) => walk(child, normalChildDepth, node.key, null, isSideBranchLine));

    if (isCollapsed) {
      const collapsedPreviewEntry = collapsedDescendantCount > 0
        ? createCollapsedPreviewEntry(node, collapsedDescendantCount, depth + 1)
        : null;
      const continuationParentKey = collapsedPreviewEntry?.key ?? node.key;
      const continuationDepth = depth + (collapsedPreviewEntry ? 2 : 1);
      const continuationRow = collapsedPreviewEntry?.row ?? rowCursor;
      const continuationEntry = nextMainQuestNode
        ? walk(nextMainQuestNode, continuationDepth, continuationParentKey, continuationRow, isSideBranchLine)
        : null;

      childEntries = [collapsedPreviewEntry, continuationEntry].filter(Boolean);
    }
    let row;

    if (fixedRow !== null) {
      row = fixedRow;
    } else if (childEntries.length > 0) {
      row = (childEntries[0].row + childEntries[childEntries.length - 1].row) / 2;
    } else {
      row = rowCursor;
      rowCursor += 1;
    }

    if (fixedRow !== null) {
      rowCursor = Math.max(rowCursor, previousRowCursor, fixedRow + 1);
    }

    const entry = {
      key: node.key,
      parentKey,
      title: node.title,
      summary: node.summary,
      status: node.status,
      displayStatus: getDisplayStatus(node.status),
      timeline: node.timeline,
      detailMarkdown: node.detailMarkdown,
      detailSourcePath: node.detailSourcePath,
      detailLabel: getDetailLabel(node),
      isTemplated: node.isTemplated === true,
      showsTemplateStatus: shouldShowTemplateStatus(node.status),
      missingItems: Array.isArray(node.missingItems) ? node.missingItems : [],
      cgRefs: Array.isArray(node.cgRefs) ? node.cgRefs : [],
      cgSequence: Array.isArray(node.cgSequence) ? node.cgSequence : [],
      gameplayRefs: Array.isArray(node.gameplayRefs) ? node.gameplayRefs : [],
      storyTags: getStoryTags(node),
      restraintRagLabels: getRestraintRagLabels(node),
      plotRefs: toValueList(node.plotRefs),
      ragRefs: toValueList(node.ragRefs),
      metaItems: getMetaItems(node),
      branchLayout: node.branchLayout,
      isSideBranchLine,
      canExportCategory: isCategoryStatus(node.status),
      depth,
      canCollapse,
      isCollapsed,
      row,
      x: CANVAS_PADDING + (isVertical ? row * VERTICAL_COLUMN_GAP : depth * COLUMN_GAP),
      y: CANVAS_PADDING
    };

    nodes.push(entry);

    if (!isCollapsed) {
      let sideDepthCursor = 0;
      const sideRow = row + SIDE_BRANCH_ROW_OFFSET;

      sideChildren.forEach((child, index) => {
        walkFixedRow(child, depth + sideDepthCursor, node.key, sideRow, true);
        sideDepthCursor += Math.max(1, countBranchDepth(child));
      });
    }

    return entry;
  }

  function walkFixedRow(node, depth, parentKey, row, isSideBranchLine = false) {
    const children = Array.isArray(node.children) ? node.children : [];
    const canCollapse = isCollapsibleStatus(node.status) && children.length > 0;
    const isCollapsed = canCollapse && collapsedKeys.has(node.key);
    const nextMainQuestNode = isCollapsed && isMainQuestNode(node) ? findNextMainQuestNode(node) : null;
    const visibleChildren = isCollapsed ? [] : children;

    rowCursor = Math.max(rowCursor, row + 1);

    const entry = {
      key: node.key,
      parentKey,
      title: node.title,
      summary: node.summary,
      status: node.status,
      displayStatus: getDisplayStatus(node.status),
      timeline: node.timeline,
      detailMarkdown: node.detailMarkdown,
      detailSourcePath: node.detailSourcePath,
      detailLabel: getDetailLabel(node),
      isTemplated: node.isTemplated === true,
      showsTemplateStatus: shouldShowTemplateStatus(node.status),
      missingItems: Array.isArray(node.missingItems) ? node.missingItems : [],
      cgRefs: Array.isArray(node.cgRefs) ? node.cgRefs : [],
      cgSequence: Array.isArray(node.cgSequence) ? node.cgSequence : [],
      gameplayRefs: Array.isArray(node.gameplayRefs) ? node.gameplayRefs : [],
      storyTags: getStoryTags(node),
      restraintRagLabels: getRestraintRagLabels(node),
      plotRefs: toValueList(node.plotRefs),
      ragRefs: toValueList(node.ragRefs),
      metaItems: getMetaItems(node),
      branchLayout: node.branchLayout,
      isSideBranchLine,
      canExportCategory: isCategoryStatus(node.status),
      depth,
      canCollapse,
      isCollapsed,
      row,
      x: CANVAS_PADDING + (isVertical ? row * VERTICAL_COLUMN_GAP : depth * COLUMN_GAP),
      y: CANVAS_PADDING
    };

    nodes.push(entry);

    const collapsedDescendantCount = isCollapsed ? getCollapsedDescendantCount(node) : 0;

    if (isCollapsed) {
      const collapsedPreviewEntry = collapsedDescendantCount > 0
        ? createCollapsedPreviewEntry(node, collapsedDescendantCount, depth + 1, row)
        : null;
      const continuationParentKey = collapsedPreviewEntry?.key ?? node.key;
      const continuationDepth = depth + (collapsedPreviewEntry ? 2 : 1);
      const continuationRow = row;

      if (nextMainQuestNode) {
        walk(nextMainQuestNode, continuationDepth, continuationParentKey, continuationRow, isSideBranchLine);
      }
    }

    visibleChildren.forEach((child, index) => {
      const childDepth = getChildDepth(depth);
      const childRow = row + index * SIDE_BRANCH_ROW_OFFSET;
      walkFixedRow(child, childDepth, node.key, childRow, isSideBranchLine || isSideBranchNode(child));
    });

    return entry;
  }

  function createCollapsedPreviewEntry(node, childCount, depth, fixedRow = null) {
    const row = fixedRow ?? rowCursor;
    rowCursor = Math.max(rowCursor, row + 1);

    const entry = {
      key: `${node.key}__collapsed-preview`,
      parentKey: node.key,
      collapseTargetKey: node.key,
      collapseTargetTitle: node.title,
      title: '...',
      summary: `已收回 ${childCount} 块`,
      status: '收回',
      displayStatus: '',
      timeline: '',
      storyTags: [],
      plotRefs: [],
      ragRefs: [],
      gameplayRefs: [],
      metaItems: [],
      depth,
      canCollapse: false,
      isCollapsed: false,
      isCollapsedPreview: true,
      row,
      x: CANVAS_PADDING + (isVertical ? row * VERTICAL_COLUMN_GAP : depth * COLUMN_GAP),
      y: CANVAS_PADDING
    };

    nodes.push(entry);
    return entry;
  }

  outline.forEach((rootNode, index) => {
    if (index > 0) {
      rowCursor += ROOT_BRANCH_GAP;
    }

    walk(rootNode, 0);
  });

  applyFixedTrackSpacing(nodes, isVertical);

  const nodeByKey = new Map(nodes.map((node) => [node.key, node]));
  const links = nodes
    .filter((node) => node.parentKey)
    .map((node) => {
      const parent = nodeByKey.get(node.parentKey);
      const parentHeight = getLayoutNodeHeight(parent);
      const nodeHeight = getLayoutNodeHeight(node);
      const isSideBranch = node.branchLayout === 'side';
      const startX = isSideBranch
        ? parent.x + (isVertical ? NODE_WIDTH : NODE_WIDTH / 2)
        : isVertical
          ? parent.x + NODE_WIDTH / 2
          : parent.x + NODE_WIDTH;
      const startY = isSideBranch
        ? parent.y + (isVertical ? parentHeight / 2 : parentHeight)
        : isVertical
          ? parent.y + parentHeight
          : parent.y + parentHeight / 2;
      const endX = isSideBranch
        ? node.x + (isVertical ? 0 : NODE_WIDTH / 2)
        : isVertical
          ? node.x + NODE_WIDTH / 2
          : node.x;
      const endY = isSideBranch
        ? node.y + (isVertical ? nodeHeight / 2 : 0)
        : isVertical
          ? node.y
          : node.y + nodeHeight / 2;
      const bend = Math.max(72, (isVertical ? endY - startY : endX - startX) * 0.48);

      return {
        key: `${node.parentKey}-${node.key}`,
        path: isSideBranch
          ? isVertical
            ? `M ${startX} ${startY} C ${startX + 64} ${startY}, ${endX - 64} ${endY}, ${endX} ${endY}`
            : `M ${startX} ${startY} C ${startX} ${startY + 64}, ${endX} ${endY - 64}, ${endX} ${endY}`
          : isVertical
          ? `M ${startX} ${startY} C ${startX} ${startY + bend}, ${endX} ${endY - bend}, ${endX} ${endY}`
          : `M ${startX} ${startY} C ${startX + bend} ${startY}, ${endX - bend} ${endY}, ${endX} ${endY}`
      };
    });
  const maxX = nodes.reduce((value, node) => Math.max(value, node.x), CANVAS_PADDING);
  const maxY = nodes.reduce((value, node) => Math.max(value, node.y + getLayoutNodeHeight(node)), CANVAS_PADDING);
  return {
    nodes: nodes.map((node) => ({
      ...node,
      style: {
        left: `${node.x}px`,
        top: `${node.y}px`,
        height: `${node.layoutHeight}px`
      }
    })),
    links,
    canvasWidth: maxX + NODE_WIDTH + CANVAS_PADDING,
    canvasHeight: maxY + CANVAS_PADDING
  };
}

const isCanvasMode = computed(() => layoutMode.value === 'vertical' || layoutMode.value === 'horizontal');
const layout = computed(() => createNodeLayout(props.outline, layoutMode.value, collapsedCategoryKeys.value));
const tableRows = computed(() => createTableRows(props.outline, collapsedCategoryKeys.value));
const summaryGroups = computed(() => createSummaryGroups(props.outline));
const filteredSummaryGroups = computed(() => createFilteredSummaryGroups(summaryGroups.value));

const canvasSpacerStyle = computed(() => ({
  width: `${layout.value.canvasWidth * zoom.value}px`,
  height: `${layout.value.canvasHeight * zoom.value}px`
}));

const canvasContentStyle = computed(() => ({
  width: `${layout.value.canvasWidth}px`,
  height: `${layout.value.canvasHeight}px`,
  transform: `scale(${zoom.value})`
}));

const zoomPercent = computed(() => `${Math.round(zoom.value * 100)}%`);
const activeDetailBlocks = computed(() => parseDetailMarkdownBlocks(activeDetailNode.value?.detailMarkdown));
const activeMissingItems = computed(() => (activeMissingNode.value?.missingItems ?? []).map(parseMissingItem));
const activeStoryCgEntries = computed(() => getStoryCgEntries(activeCgNode.value));
const activeStoryCgVariant = computed(() => {
  const preview = activeStoryCgPreview.value;
  return preview?.variants[preview.activeVariantIndex] ?? null;
});

function parseDetailMarkdownBlocks(markdown) {
  const blocks = [];
  const paragraphLines = [];
  let activeList = null;
  let activeQuoteLines = [];

  const flushParagraph = () => {
    const text = paragraphLines.join('\n').trim();

    if (text) {
      blocks.push({
        type: 'text',
        text
      });
    }

    paragraphLines.length = 0;
  };

  const flushList = () => {
    if (activeList?.items?.length > 0) {
      blocks.push(activeList);
    }

    activeList = null;
  };

  const flushQuote = () => {
    const text = activeQuoteLines.join('\n').trim();

    if (text) {
      blocks.push({
        type: 'quote',
        text
      });
    }

    activeQuoteLines = [];
  };

  const flushInlineBlocks = () => {
    flushParagraph();
    flushList();
    flushQuote();
  };

  String(markdown ?? '')
    .split(/\r?\n/)
    .forEach((rawLine) => {
      const line = rawLine.trim();

      if (!line) {
        flushInlineBlocks();
        return;
      }

      const imageMatch = line.match(/^!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)$/);

      if (imageMatch) {
        flushInlineBlocks();

        const imagePath = imageMatch[2];
        const imageUrl = resolveDetailImageUrl(imagePath);

        blocks.push(imageUrl
          ? {
            type: 'image',
            alt: imageMatch[1].trim(),
            src: imageUrl
          }
          : {
            type: 'text',
            text: line
          });
        return;
      }

      const headingMatch = line.match(/^(#{1,4})\s+(.+)$/);

      if (headingMatch) {
        flushInlineBlocks();
        blocks.push({
          type: 'heading',
          level: Math.min(4, headingMatch[1].length + 2),
          text: headingMatch[2].trim()
        });
        return;
      }

      const quoteMatch = line.match(/^>\s?(.*)$/);

      if (quoteMatch) {
        flushParagraph();
        flushList();
        activeQuoteLines.push(quoteMatch[1].trim());
        return;
      }

      const unorderedListMatch = line.match(/^[-*+]\s+(.+)$/);
      const orderedListMatch = line.match(/^\d+[.)]\s+(.+)$/);

      if (unorderedListMatch || orderedListMatch) {
        const ordered = Boolean(orderedListMatch);
        const item = (orderedListMatch?.[1] ?? unorderedListMatch?.[1] ?? '').trim();

        flushParagraph();
        flushQuote();

        if (!activeList || activeList.ordered !== ordered) {
          flushList();
          activeList = {
            type: 'list',
            ordered,
            items: []
          };
        }

        if (item) {
          activeList.items.push(item);
        }
        return;
      }

      flushList();
      flushQuote();
      paragraphLines.push(line);
    });

  flushInlineBlocks();

  return blocks;
}

function createDetailImageUrlMap(modules) {
  const imageMap = new Map();

  Object.entries(modules).forEach(([modulePath, url]) => {
    const normalizedPath = normalizeDetailImagePath(modulePath);
    const srcPath = normalizedPath.replace(/^(?:\.\.\/){4}assets\//, 'src/assets/');

    addDetailImagePath(imageMap, srcPath, url);
    addDetailImagePath(imageMap, srcPath.replace(/^src\//, ''), url);
    addDetailImagePath(imageMap, srcPath.replace(/^src\/assets\/game\/outlines\//, 'game/outlines/'), url);
  });

  return imageMap;
}

function addDetailImagePath(imageMap, imagePath, url) {
  const normalizedPath = normalizeDetailImagePath(imagePath);

  if (normalizedPath) {
    imageMap.set(normalizedPath, url);
  }
}

function resolveDetailImageUrl(imagePath) {
  const normalizedPath = normalizeDetailImagePath(imagePath);

  return detailImageUrlByPath.get(normalizedPath)
    ?? detailImageUrlByPath.get(normalizedPath.replace(/^\/?src\//, 'src/'))
    ?? detailImageUrlByPath.get(normalizedPath.replace(/^\/?assets\//, 'assets/'))
    ?? '';
}

function normalizeDetailImagePath(imagePath) {
  return String(imagePath ?? '')
    .trim()
    .replace(/^['"]|['"]$/g, '')
    .replace(/\\/g, '/')
    .replace(/^\/+/, '')
    .replace(/^\.\//, '');
}

function setZoom(nextZoom, anchorEvent = null) {
  const viewport = viewportRef.value;
  const currentZoom = zoom.value;
  const normalizedZoom = clamp(Number(nextZoom.toFixed(2)), MIN_ZOOM, MAX_ZOOM);

  if (!viewport || normalizedZoom === currentZoom) {
    zoom.value = normalizedZoom;
    return;
  }

  const rect = viewport.getBoundingClientRect();
  const anchorX = anchorEvent ? anchorEvent.clientX - rect.left : viewport.clientWidth / 2;
  const anchorY = anchorEvent ? anchorEvent.clientY - rect.top : viewport.clientHeight / 2;
  const contentX = (viewport.scrollLeft + anchorX) / currentZoom;
  const contentY = (viewport.scrollTop + anchorY) / currentZoom;

  zoom.value = normalizedZoom;

  nextTick(() => {
    viewport.scrollLeft = contentX * normalizedZoom - anchorX;
    viewport.scrollTop = contentY * normalizedZoom - anchorY;
  });
}

function zoomIn() {
  setZoom(zoom.value + ZOOM_STEP);
}

function zoomOut() {
  setZoom(zoom.value - ZOOM_STEP);
}

function resetView() {
  zoom.value = 0.88;
  nextTick(centerCanvasStart);
}

function setLayoutMode(nextMode) {
  if (!layoutModeOptions.some((option) => option.key === nextMode) || layoutMode.value === nextMode) {
    return;
  }

  layoutMode.value = nextMode;
}

function centerCanvasStart() {
  const viewport = viewportRef.value;

  if (!viewport) {
    return;
  }

  viewport.scrollLeft = 72 * zoom.value;
  viewport.scrollTop = 76 * zoom.value;
}

function handlePointerDown(event) {
  if (event.button !== 0 || event.target.closest('button')) {
    return;
  }

  const viewport = viewportRef.value;

  if (!viewport) {
    return;
  }

  isDragging.value = true;
  dragState.value = {
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    scrollLeft: viewport.scrollLeft,
    scrollTop: viewport.scrollTop
  };
  viewport.setPointerCapture(event.pointerId);
}

function handlePointerMove(event) {
  const viewport = viewportRef.value;

  if (!viewport || !isDragging.value || !dragState.value) {
    return;
  }

  viewport.scrollLeft = dragState.value.scrollLeft - (event.clientX - dragState.value.startX);
  viewport.scrollTop = dragState.value.scrollTop - (event.clientY - dragState.value.startY);
}

function handlePointerUp(event) {
  const viewport = viewportRef.value;

  if (viewport && dragState.value?.pointerId === event.pointerId && viewport.hasPointerCapture(event.pointerId)) {
    viewport.releasePointerCapture(event.pointerId);
  }

  isDragging.value = false;
  dragState.value = null;
}

function handleWheel(event) {
  if (!event.ctrlKey && !event.metaKey) {
    return;
  }

  event.preventDefault();
  setZoom(zoom.value + (event.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP), event);
}

onMounted(() => {
  nextTick(centerCanvasStart);
  document.addEventListener('keydown', handleDocumentKeydown);
});

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleDocumentKeydown);
});

watch(layoutMode, () => {
  nextTick(centerCanvasStart);
});

watch(activeDetailNode, (node) => {
  if (!node) {
    return;
  }

  nextTick(() => {
    detailDialogRef.value?.focus();
  });
});

watch(activeMissingNode, (node) => {
  if (!node) {
    return;
  }

  nextTick(() => {
    missingDialogRef.value?.focus();
  });
});

watch(activeCgNode, (node) => {
  if (!node) {
    return;
  }

  nextTick(() => {
    cgDialogRef.value?.focus();
  });
});

watch(activeStoryCgPreview, (preview) => {
  if (!preview) {
    nextTick(() => cgDialogRef.value?.focus());
    return;
  }

  nextTick(() => cgPreviewDialogRef.value?.focus());
});
</script>


