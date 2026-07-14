export type DirectionPadInput = 'up' | 'right' | 'down' | 'left';
export type DirectionPadGameMode = 'sequence' | 'rhythm';

export interface DirectionPadRhythmSettings {
  leadInMs: number;
  noteSpacingMs: number;
  hitWindowMs: number;
  hitLinePercent?: number;
  travelMs?: number;
}

export interface DirectionPadGameDefinition {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  backgroundSrc?: string;
  mode?: DirectionPadGameMode;
  rhythm?: DirectionPadRhythmSettings;
  countdownDurationMs?: number;
  targetSequence: ReadonlyArray<DirectionPadInput>;
}

export interface DirectionPadGameResolvedNote {
  input: DirectionPadInput | null;
  expected: DirectionPadInput;
  result: 'hit' | 'miss';
  timingOffsetMs?: number;
}

export interface DirectionPadGameState {
  gameId: string;
  inputSequence: DirectionPadInput[];
  resolvedNotes?: DirectionPadGameResolvedNote[];
  activeNote?: DirectionPadGameResolvedNote;
  startedAtMs?: number;
  countdownEndsAtMs?: number;
  status: 'countdown' | 'playing' | 'success';
}

export interface DirectionPadGamePayload {
  definition: DirectionPadGameDefinition;
  state: DirectionPadGameState;
  nextInput: DirectionPadInput | null;
  currentNoteIndex: number;
  errorCount: number;
  errorRate: number;
}

export class DirectionPadGameRunner {
  private definitions: Record<string, DirectionPadGameDefinition>;

  constructor(definitions: Record<string, DirectionPadGameDefinition>) {
    this.definitions = definitions;
  }

  startGame(gameId: string, startedAtMs = Date.now()): DirectionPadGamePayload | null {
    const definition = this.definitions[gameId];

    if (!definition) {
      return null;
    }

    const countdownDurationMs = Math.max(0, definition.countdownDurationMs ?? 0);

    return this.createPayload(definition, {
      gameId,
      inputSequence: [],
      resolvedNotes: [],
      startedAtMs: countdownDurationMs > 0 ? undefined : startedAtMs,
      countdownEndsAtMs: countdownDurationMs > 0 ? startedAtMs + countdownDurationMs : undefined,
      status: countdownDurationMs > 0 ? 'countdown' : 'playing'
    });
  }

  pressDirection(
    state: DirectionPadGameState,
    input: DirectionPadInput,
    pressedAtMs = Date.now()
  ): DirectionPadGamePayload | null {
    const definition = this.definitions[state.gameId];

    if (!definition) {
      return null;
    }

    if (state.status !== 'playing') {
      return this.createPayload(definition, state);
    }

    if (definition.mode === 'rhythm') {
      return this.pressRhythmDirection(definition, state, input, pressedAtMs);
    }

    const nextState: DirectionPadGameState = {
      ...state,
      inputSequence: [...state.inputSequence, input],
      status: 'playing'
    };

    if (nextState.inputSequence.length >= definition.targetSequence.length) {
      nextState.status = 'success';
    }

    return this.createPayload(definition, nextState);
  }

  restartGame(state: DirectionPadGameState): DirectionPadGamePayload | null {
    return this.startGame(state.gameId);
  }

  completeCountdown(state: DirectionPadGameState, checkedAtMs = Date.now()): DirectionPadGamePayload | null {
    const definition = this.definitions[state.gameId];

    if (!definition) {
      return null;
    }

    if (state.status !== 'countdown') {
      return this.createPayload(definition, state);
    }

    const countdownEndsAtMs = state.countdownEndsAtMs ?? checkedAtMs;

    if (checkedAtMs < countdownEndsAtMs) {
      return this.createPayload(definition, state);
    }

    return this.createPayload(definition, {
      ...state,
      startedAtMs: checkedAtMs,
      countdownEndsAtMs: undefined,
      status: 'playing'
    });
  }

  resolveExpiredNotes(state: DirectionPadGameState, checkedAtMs = Date.now()): DirectionPadGamePayload | null {
    const definition = this.definitions[state.gameId];

    if (!definition) {
      return null;
    }

    if (definition.mode !== 'rhythm' || state.status !== 'playing') {
      return this.createPayload(definition, state);
    }

    const rhythm = definition.rhythm;
    const startedAtMs = state.startedAtMs ?? checkedAtMs;
    const resolvedNotes = [...(state.resolvedNotes ?? [])];
    let activeNote = state.activeNote;
    let noteIndex = resolvedNotes.length;

    if (!rhythm) {
      return this.createPayload(definition, state);
    }

    if (activeNote) {
      const activeHitAtMs = startedAtMs + rhythm.leadInMs + noteIndex * rhythm.noteSpacingMs;

      if (checkedAtMs >= activeHitAtMs) {
        resolvedNotes.push(activeNote);
        activeNote = undefined;
        noteIndex += 1;
      }
    }

    while (noteIndex < definition.targetSequence.length) {
      const expectedHitAtMs = startedAtMs + rhythm.leadInMs + noteIndex * rhythm.noteSpacingMs;
      const timingOffsetMs = checkedAtMs - expectedHitAtMs;

      if (timingOffsetMs <= rhythm.hitWindowMs) {
        break;
      }

      resolvedNotes.push({
        input: null,
        expected: definition.targetSequence[noteIndex],
        result: 'miss',
        timingOffsetMs
      });
      noteIndex += 1;
    }

    if (resolvedNotes.length === (state.resolvedNotes?.length ?? 0) && activeNote === state.activeNote) {
      return this.createPayload(definition, state);
    }

    return this.createPayload(definition, {
      ...state,
      activeNote,
      resolvedNotes,
      startedAtMs,
      status: resolvedNotes.length >= definition.targetSequence.length ? 'success' : 'playing'
    });
  }

  private createPayload(
    definition: DirectionPadGameDefinition,
    state: DirectionPadGameState
  ): DirectionPadGamePayload {
    const resolvedNotes = state.resolvedNotes ?? [];
    const judgedNotes = state.activeNote ? [...resolvedNotes, state.activeNote] : resolvedNotes;
    const isRhythmMode = definition.mode === 'rhythm';
    const errorCount = isRhythmMode
      ? judgedNotes.filter((note) => note.result === 'miss').length
      : state.inputSequence.reduce((count, input, index) => {
        return input === definition.targetSequence[index] ? count : count + 1;
      }, 0);
    const resolvedInputCount = isRhythmMode
      ? Math.min(judgedNotes.length, definition.targetSequence.length)
      : Math.min(state.inputSequence.length, definition.targetSequence.length);
    const errorRate = resolvedInputCount > 0 ? errorCount / resolvedInputCount : 0;
    const currentNoteIndex = isRhythmMode
      ? Math.min(resolvedNotes.length, definition.targetSequence.length)
      : resolvedInputCount;

    return {
      definition,
      state,
      nextInput: state.status === 'playing'
        ? definition.targetSequence[currentNoteIndex] ?? null
        : null,
      currentNoteIndex,
      errorCount,
      errorRate
    };
  }

  private pressRhythmDirection(
    definition: DirectionPadGameDefinition,
    state: DirectionPadGameState,
    input: DirectionPadInput,
    pressedAtMs: number
  ): DirectionPadGamePayload {
    const rhythm = definition.rhythm;
    const resolvedNotes = state.resolvedNotes ?? [];
    const noteIndex = resolvedNotes.length;
    const expected = definition.targetSequence[noteIndex];

    if (!rhythm || !expected) {
      return this.createPayload(definition, state);
    }

    const startedAtMs = state.startedAtMs ?? pressedAtMs;
    const expectedHitAtMs = startedAtMs + rhythm.leadInMs + noteIndex * rhythm.noteSpacingMs;
    const timingOffsetMs = pressedAtMs - expectedHitAtMs;
    const isHit = input === expected && Math.abs(timingOffsetMs) <= rhythm.hitWindowMs;
    const note: DirectionPadGameResolvedNote = {
      input,
      expected,
      result: isHit ? 'hit' : 'miss',
      timingOffsetMs
    };
    const nextResolvedNotes: DirectionPadGameResolvedNote[] = timingOffsetMs < 0
      ? resolvedNotes
      : [...resolvedNotes, note];
    const nextActiveNote = timingOffsetMs < 0 ? note : undefined;

    const nextState: DirectionPadGameState = {
      ...state,
      inputSequence: [...state.inputSequence, input],
      activeNote: nextActiveNote,
      resolvedNotes: nextResolvedNotes,
      startedAtMs,
      status: nextResolvedNotes.length >= definition.targetSequence.length ? 'success' : 'playing'
    };

    return this.createPayload(definition, nextState);
  }
}
