import { GRAPH_LANE_ORDER, LAYOUT_SEED, resolveGraphLaneType } from './constants.js';
import { hashString } from './buildOutlineRelationGraph.js';

const LANE_WIDTH = 220;
const LANE_GAP = 48;
const NODE_HEIGHT_OVERVIEW = 28;
const NODE_HEIGHT_DETAIL = 56;
const NODE_GAP = 10;
const LANE_PADDING_Y = 72;
const LANE_PADDING_X = 24;

/**
 * Deterministic partitioned (swimlane) layout.
 * Same data + seed → stable coordinates.
 * Returns lightweight positioned nodes (no full node clones).
 */
export function layoutOutlineRelationGraph(graph, options = {}) {
  const preset = options.preset === 'aesthetic' ? 'aesthetic' : 'structure';
  const mode = options.mode || 'overview';
  const seed = options.seed ?? graph?.layoutSeed ?? hashString(LAYOUT_SEED);
  const overrides = options.positionOverrides || {};
  const nodes = Array.isArray(graph?.nodes) ? graph.nodes : [];
  const showSummary = mode !== 'overview';
  const nodeHeight = showSummary ? NODE_HEIGHT_DETAIL : NODE_HEIGHT_OVERVIEW;

  const lanes = GRAPH_LANE_ORDER.map((type, laneIndex) => ({
    type,
    laneIndex,
    x: LANE_PADDING_X + laneIndex * (LANE_WIDTH + LANE_GAP),
    width: LANE_WIDTH,
    nodes: []
  }));
  const laneByType = new Map(lanes.map((lane) => [lane.type, lane]));

  const ranked = nodes.map((node) => {
    const laneType = resolveGraphLaneType(node.type);
    return {
      node,
      laneType,
      laneIndex: laneByType.get(laneType)?.laneIndex ?? 99,
      rank: hashString(`${seed}:${node.id}`) % 100000
    };
  });
  ranked.sort((left, right) => {
    if (left.laneIndex !== right.laneIndex) return left.laneIndex - right.laneIndex;
    if (left.rank !== right.rank) return left.rank - right.rank;
    return String(left.node.title).localeCompare(String(right.node.title), 'zh-CN');
  });

  for (const entry of ranked) {
    const lane = laneByType.get(entry.laneType) || laneByType.get('story');
    lane.nodes.push(entry);
  }

  const positioned = [];
  const nodeById = new Map();
  let maxY = 0;
  let maxX = 0;

  for (const lane of lanes) {
    let cursorY = LANE_PADDING_Y;
    for (const entry of lane.nodes) {
      const node = entry.node;
      const override = overrides[node.id];
      let x = lane.x + 12;
      let y = cursorY;

      if (preset === 'aesthetic') {
        const wave = Math.sin((hashString(`${seed}:wave:${node.id}`) % 360) * (Math.PI / 180)) * 18;
        const drift = (hashString(`${seed}:drift:${node.id}`) % 40) - 20;
        x += drift * 0.35;
        y += wave;
      }

      if (override && Number.isFinite(override.x) && Number.isFinite(override.y)) {
        x = override.x;
        y = override.y;
      }

      const width = lane.width - 24;
      const height = nodeHeight;
      const placed = {
        id: node.id,
        type: node.type,
        title: node.title,
        summary: node.summary || '',
        auditStatus: node.auditStatus,
        x,
        y,
        width,
        height,
        laneType: lane.type,
        laneIndex: lane.laneIndex,
        showSummary
      };
      positioned.push(placed);
      nodeById.set(placed.id, placed);

      cursorY = Math.max(cursorY + height + NODE_GAP, y + height + NODE_GAP);
      maxY = Math.max(maxY, y + height);
      maxX = Math.max(maxX, x + width);
    }
    lane.height = Math.max(cursorY, LANE_PADDING_Y);
  }

  return {
    preset,
    mode,
    seed,
    nodeHeight,
    showSummary,
    lanes: lanes.map((lane) => ({
      type: lane.type,
      laneIndex: lane.laneIndex,
      x: lane.x,
      width: lane.width,
      height: lane.height,
      label: lane.type
    })),
    nodes: positioned,
    nodeById,
    canvasWidth: Math.max(maxX + 80, lanes.length * (LANE_WIDTH + LANE_GAP) + LANE_PADDING_X),
    canvasHeight: Math.max(maxY + 120, 640)
  };
}

export function getNodeDisplayFields(node, mode) {
  if (mode === 'overview') {
    return {
      title: node.title,
      summary: '',
      showSummary: false,
      showCategory: false,
      showStatus: Boolean(
        node.auditStatus && node.auditStatus !== 'confirmed' && node.auditStatus !== 'auto_generated'
      )
    };
  }

  return {
    title: node.title,
    summary: node.summary || '',
    showSummary: true,
    showCategory: true,
    showStatus: true
  };
}

export { LANE_WIDTH, LANE_GAP };
