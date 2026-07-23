export const COVERAGE_STAGES = ['concept', 'outline', 'productionDesign', 'skeleton', 'graybox', 'partiallyPlayable', 'playable', 'validated'];

function normalizeEvidence(evidence = {}) {
  return Object.fromEntries(COVERAGE_STAGES.map((stage) => [stage, Array.isArray(evidence[stage]) ? evidence[stage] : []]));
}

export function deriveCoverage(input = {}) {
  const worlds = (input.worlds ?? []).map((world) => ({
    id: world.id,
    title: world.title,
    series: (world.series ?? []).map((series) => {
      const evidence = normalizeEvidence(series.evidence);
      let stage = null;
      for (const candidate of COVERAGE_STAGES) if (evidence[candidate].length > 0) stage = candidate;
      const dimensions = Object.fromEntries(COVERAGE_STAGES.map((candidate) => [candidate, evidence[candidate].length > 0]));
      const stageIndex = COVERAGE_STAGES.indexOf(stage);
      const gaps = COVERAGE_STAGES.slice(stageIndex + 1).filter((candidate) => evidence[candidate].length === 0);
      return { id: series.id, title: series.title, stage, dimensions, evidence, gaps };
    })
  }));
  return { schemaVersion: 1, generatedFrom: 'explicit-project-evidence', worlds };
}
