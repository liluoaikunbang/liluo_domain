export interface InteractiveFictionChoiceData {
  id: string;
  label: string;
  next?: string;
  revealClues?: string[];
  activateTasks?: string[];
  completeTasks?: string[];
}

export type InteractiveFictionFlagValue = string | number | boolean;
export type InteractiveFictionFlags = Record<string, InteractiveFictionFlagValue>;

export interface InteractiveFictionNodeData {
  id: string;
  title?: string;
  backgroundKey?: string;
  portraitKey?: string;
  paragraphs: string[];
  choices?: InteractiveFictionChoiceData[];
  setFlags?: InteractiveFictionFlags;
}

export interface InteractiveFictionClueData {
  id: string;
  title: string;
  text: string;
}

export interface InteractiveFictionTaskData {
  id: string;
  title: string;
  hint: string;
}

export interface InteractiveFictionScenarioData {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  startNodeId: string;
  defaultBackgroundKey?: string;
  defaultPortraitKey?: string;
  nodes: Record<string, InteractiveFictionNodeData>;
  clues?: InteractiveFictionClueData[];
  tasks?: InteractiveFictionTaskData[];
}

export interface InteractiveFictionState {
  scenarioId: string;
  nodeId: string;
  visitedNodeIds: string[];
  revealedClueIds: string[];
  activeTaskIds: string[];
  completedTaskIds: string[];
  flags: InteractiveFictionFlags;
}

export interface InteractiveFictionPayload {
  scenario: InteractiveFictionScenarioData;
  node: InteractiveFictionNodeData;
  state: InteractiveFictionState;
  visibleClues: InteractiveFictionClueData[];
  activeTasks: InteractiveFictionTaskData[];
  completedTasks: InteractiveFictionTaskData[];
}

function uniqueList(values: ReadonlyArray<string>): string[] {
  return Array.from(new Set(values));
}

function createInitialState(scenario: InteractiveFictionScenarioData): InteractiveFictionState {
  return {
    scenarioId: scenario.id,
    nodeId: scenario.startNodeId,
    visitedNodeIds: [scenario.startNodeId],
    revealedClueIds: [],
    activeTaskIds: [],
    completedTaskIds: [],
    flags: {}
  };
}

export class InteractiveFictionRunner {
  private readonly scenarios: Record<string, InteractiveFictionScenarioData>;

  constructor(scenarios: Record<string, InteractiveFictionScenarioData>) {
    this.scenarios = scenarios;
  }

  startScenario(scenarioId: string): InteractiveFictionPayload | null {
    const scenario = this.scenarios[scenarioId];

    if (!scenario) {
      console.error(`未找到互动小说副本: ${scenarioId}`);
      return null;
    }

    return this.resolvePayload(scenario, createInitialState(scenario));
  }

  restartScenario(state: InteractiveFictionState): InteractiveFictionPayload | null {
    return this.startScenario(state.scenarioId);
  }

  selectChoice(state: InteractiveFictionState, choiceId: string): InteractiveFictionPayload | null {
    const scenario = this.scenarios[state.scenarioId];

    if (!scenario) {
      console.error(`未找到互动小说副本: ${state.scenarioId}`);
      return null;
    }

    const currentNode = scenario.nodes[state.nodeId];
    const choice = currentNode?.choices?.find((candidate) => candidate.id === choiceId);

    if (!currentNode || !choice) {
      console.error(`未找到互动小说选项: ${state.scenarioId}:${state.nodeId}:${choiceId}`);
      return null;
    }

    if (!choice.next) {
      return null;
    }

    const nextState: InteractiveFictionState = {
      scenarioId: state.scenarioId,
      nodeId: choice.next,
      visitedNodeIds: uniqueList([...state.visitedNodeIds, choice.next]),
      revealedClueIds: uniqueList([...state.revealedClueIds, ...(choice.revealClues ?? [])]),
      activeTaskIds: uniqueList([
        ...state.activeTaskIds.filter((taskId) => !(choice.completeTasks ?? []).includes(taskId)),
        ...(choice.activateTasks ?? [])
      ]),
      completedTaskIds: uniqueList([...state.completedTaskIds, ...(choice.completeTasks ?? [])]),
      flags: { ...(state.flags ?? {}) }
    };

    return this.resolvePayload(scenario, nextState);
  }

  private resolvePayload(
    scenario: InteractiveFictionScenarioData,
    state: InteractiveFictionState
  ): InteractiveFictionPayload | null {
    const node = scenario.nodes[state.nodeId];

    if (!node) {
      console.error(`未找到互动小说节点: ${scenario.id}:${state.nodeId}`);
      return null;
    }

    const clues = scenario.clues ?? [];
    const tasks = scenario.tasks ?? [];
    const resolvedState = {
      ...state,
      flags: {
        ...(state.flags ?? {}),
        ...(node.setFlags ?? {})
      }
    };

    return {
      scenario,
      node,
      state: resolvedState,
      visibleClues: clues.filter((clue) => resolvedState.revealedClueIds.includes(clue.id)),
      activeTasks: tasks.filter((task) => resolvedState.activeTaskIds.includes(task.id)),
      completedTasks: tasks.filter((task) => resolvedState.completedTaskIds.includes(task.id))
    };
  }
}
