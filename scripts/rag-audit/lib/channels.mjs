/** Shared channel helpers for knowledge-audit calibration. */

export const AUDIT_CHANNELS = Object.freeze(['rag', 'style-rag', 'concept', 'plot'])

export const AUDIT_CHANNEL_LABELS = Object.freeze({
  rag: '普通 RAG',
  'style-rag': 'Style-RAG',
  concept: '细节概念',
  plot: '情节'
})

export const CHANNEL_RELATED_SKILLS = Object.freeze({
  rag: ['liluo-external-fiction-knowledge'],
  'style-rag': ['liluo-style-rag'],
  concept: ['outline-relation-graph', 'liluo-external-fiction-knowledge'],
  plot: ['plot-catalog', 'outline-relation-graph']
})

export function assertAuditChannel(channel, { allowAll = false } = {}) {
  if (allowAll && channel === 'all') return 'all'
  if (!AUDIT_CHANNELS.includes(channel)) {
    throw new Error(
      `channel 必须是 ${AUDIT_CHANNELS.join(' | ')}${allowAll ? ' | all' : ''}（收到：${channel ?? 'empty'}）`
    )
  }
  return channel
}

export function channelRecordDirKey(channel) {
  if (channel === 'style-rag') return 'style-rag'
  return channel
}
