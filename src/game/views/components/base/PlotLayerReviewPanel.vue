<template>
  <section class="plot-layer-review" aria-label="情节层级核对">
    <div class="toolbar">
      <p class="lead">
        只读核对队列。AI 建议不会自动写入；请在对话中逐条确认后，用
        <code>npm run plot-layer:confirm</code> 记录，再用
        <code>--apply --confirm-token</code> 执行单条迁移。
      </p>
      <span class="count" v-if="summary">
        待确认 {{ pendingCount }} · 明显 RAG {{ summary.obviousMoveToRag ?? 0 }} · 拆分
        {{ summary.splitCandidates ?? 0 }} · 不确定 {{ summary.uncertain ?? 0 }}
      </span>
    </div>
    <div class="browser">
      <GameScrollArea class="entry-list">
        <h3>核对队列</h3>
        <button
          v-for="item in items"
          :key="item.sourcePlotId"
          type="button"
          :class="{ active: selectedId === item.sourcePlotId }"
          @click="selectedId = item.sourcePlotId"
        >
          <span>{{ item.sourcePlotId }}</span>
          <strong>{{ item.title }}</strong>
          <small>{{ recommendationLabel(item.recommendation) }} · {{ item.reviewStatus }}</small>
        </button>
        <p v-if="!items.length" class="empty">尚无审计队列。请先运行 <code>npm run plot-layer:audit</code>。</p>
      </GameScrollArea>
      <GameScrollArea class="detail">
        <article v-if="selected">
          <header>
            <span>{{ selected.sourcePlotId }}</span>
            <h3>{{ selected.title }}</h3>
            <small>{{ recommendationLabel(selected.recommendation) }}</small>
          </header>
          <dl>
            <dt>建议层级</dt>
            <dd>{{ selected.recommendedLayer }}</dd>
            <dt>置信度</dt>
            <dd>{{ Math.round((selected.confidence ?? 0) * 100) }}%</dd>
            <dt>核对状态</dt>
            <dd>{{ selected.reviewStatus }}</dd>
            <dt>建议 RAG</dt>
            <dd>
              <template v-if="selected.proposedRagTarget">
                {{ selected.proposedRagTarget.title }}
                <small v-if="selected.proposedRagTarget.existingRagId">(已有 {{ selected.proposedRagTarget.existingRagId }})</small>
                <small v-else-if="selected.proposedRagTarget.newRagId">(新建 {{ selected.proposedRagTarget.newRagId }})</small>
              </template>
              <template v-else>无</template>
            </dd>
            <dt>关联故事</dt>
            <dd>{{ selected.affectedStoryEntries?.join('、') || '无' }}</dd>
          </dl>
          <section v-if="selected.rationale?.length">
            <h4>判断理由</h4>
            <ul>
              <li v-for="(line, index) in selected.rationale" :key="index">{{ line }}</li>
            </ul>
          </section>
          <section v-if="selected.questionsForUser?.length">
            <h4>需你确认</h4>
            <ul>
              <li v-for="(line, index) in selected.questionsForUser" :key="index">{{ line }}</li>
            </ul>
          </section>
          <section class="actions" aria-label="可选决策">
            <h4>可选决策（在对话中确认）</h4>
            <p>保留为情节 / 整体迁入 RAG / 拆为情节+RAG / 提升为故事 / 并入已有 / 归档 / 暂缓 / 重新分析 / 手工方案</p>
          </section>
        </article>
        <p v-else class="empty">请选择一条待核对情节。</p>
      </GameScrollArea>
    </div>
  </section>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import GameScrollArea from './GameScrollArea.vue'

const props = defineProps({
  queue: { type: Object, required: true }
})

const items = computed(() => props.queue?.items ?? [])
const summary = computed(() => props.queue?.summary ?? null)
const pendingCount = computed(
  () => items.value.filter((item) => item.reviewStatus === 'proposed').length
)
const selectedId = ref(items.value[0]?.sourcePlotId ?? '')
const selected = computed(
  () => items.value.find((item) => item.sourcePlotId === selectedId.value) ?? items.value[0] ?? null
)

watch(items, (value) => {
  if (!value.some((item) => item.sourcePlotId === selectedId.value)) {
    selectedId.value = value[0]?.sourcePlotId ?? ''
  }
})

function recommendationLabel(value) {
  return (
    {
      'move-to-rag': '迁入 RAG',
      'split-plot-and-rag': '拆分',
      'promote-to-story': '提升为故事',
      'keep-as-plot': '保留情节',
      uncertain: '不确定',
      archive: '归档',
      'merge-into-existing-rag': '并入 RAG',
      'merge-into-existing-plot': '并入情节'
    }[value] ?? value
  )
}
</script>

<style scoped>
.plot-layer-review {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  min-height: 0;
  height: 100%;
}
.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: flex-start;
  justify-content: space-between;
}
.lead {
  margin: 0;
  max-width: 52rem;
  line-height: 1.5;
}
.count {
  opacity: 0.85;
  white-space: nowrap;
}
.browser {
  display: grid;
  grid-template-columns: minmax(14rem, 20rem) minmax(0, 1fr);
  gap: 0.75rem;
  min-height: 0;
  flex: 1;
}
.entry-list button {
  display: grid;
  gap: 0.15rem;
  width: 100%;
  text-align: left;
  margin-bottom: 0.35rem;
}
.entry-list button.active {
  outline: 1px solid currentColor;
}
.detail article {
  display: grid;
  gap: 0.75rem;
}
.detail header {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: baseline;
}
.detail dl {
  display: grid;
  grid-template-columns: 7rem 1fr;
  gap: 0.35rem 0.75rem;
}
.detail ul {
  margin: 0.25rem 0 0;
  padding-left: 1.1rem;
}
.empty {
  opacity: 0.75;
}
code {
  font-size: 0.9em;
}
@media (max-width: 900px) {
  .browser {
    grid-template-columns: 1fr;
  }
}
</style>
