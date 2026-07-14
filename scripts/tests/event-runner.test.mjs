import test from 'node:test';
import assert from 'node:assert/strict';

import { resolveDialogueChoice } from '../../src/game/core/dialogueExecution.ts';
import { DirectionPadGameRunner } from '../../src/game/core/directionPadGame.ts';
import { executeEventActions } from '../../src/game/core/eventExecution.ts';
import { InteractiveFictionRunner } from '../../src/game/core/interactiveFiction.ts';
import {
  getPlayerAppearanceId,
  getPlayerPortraitKey,
  resetPlayerRuntimeState,
  resolvePlayerRuntimeCharacterDefinition,
  resolvePlayerRuntimePortrait,
  resolvePlayerRuntimeStatusLabel,
  setPlayerAppearance,
  setPlayerPortrait,
  setPlayerRestraints,
  setPlayerStatus
} from '../../src/game/core/playerRuntime.ts';
import liluoRoomDialogues from '../../src/game/data/maps/munika/liluo_room/dialogues.ts';
import liluoRoomEvents from '../../src/game/data/maps/munika/liluo_room/events.json' with { type: 'json' };
import liluoEstateDialogues from '../../src/game/data/maps/munika/liluo_estate/dialogues.json' with { type: 'json' };
import { liluoEstateAssetBundle } from '../../src/game/data/maps/munika/liluo_estate/assets.ts';
import cityJingjiangSchoolMap from '../../src/game/data/maps/modern/city_Jingjiang_school/map.json' with { type: 'json' };
import asylumForLunaticInteractiveFictionScenario from '../../src/game/data/interactive_fictions/asylum_for_lunatic/scenario.json' with { type: 'json' };
import { directionPadGameRegistry } from '../../src/game/data/minigames/directionPadGames.ts';
import { cityJingjiangSchoolMeta } from '../../src/game/data/maps/modern/city_Jingjiang_school/meta.ts';
import { globalDialoguePortraits } from '../../src/game/data/dialoguePortraits.ts';
import {
  playerAppearanceSpriteSheets,
  playerCharacterAssetBundle,
  resolvePlayerCharacterSpriteSheetUrl
} from '../../src/game/data/playerCharacter.ts';
import { playerStatusDefinitions } from '../../src/game/data/playerStatus.ts';

function createNoopPlayerRuntimeExecutionContext(overrides = {}) {
  return {
    setPlayerPortrait: () => true,
    setPlayerAppearance: () => true,
    getPlayerStatus: () => [],
    setPlayerStatus: () => true,
    setMapSessionFlag: () => true,
    ...overrides
  };
}

test('time-of-day event calls setTimeOfDay context and does not require dialogue', () => {
  const received = [];

  const result = executeEventActions({
    eventId: 'estate_dusk_transition',
    triggerType: 'manual',
    timeOfDayChange: {
      timeOfDayId: 'dusk'
    }
  }, {
    setTimeOfDay: (timeOfDayId) => {
      received.push(timeOfDayId);
      return true;
    }
  }, {
    resolveDialogue: () => null
  });

  assert.deepEqual(received, ['dusk']);
  assert.equal(result.didExecute, true);
  assert.equal(result.dialogue, null);
});

test('dialogue choice can switch time of day before moving to the next node', () => {
  const received = [];

  const choice = resolveDialogueChoice({
    id: 'start',
    text: '浣犳兂鎶婂涵闄㈣皟鎴愪粈涔堟牱鐨勫ぉ鑹诧紵',
    choices: [
      {
        id: 'switch_to_day',
        label: '鐧藉ぉ',
        next: 'day_selected',
        timeOfDayChange: {
          timeOfDayId: 'day'
        }
      }
    ]
  }, 'switch_to_day',
    {
      setTimeOfDay: (timeOfDayId) => {
        received.push(timeOfDayId);
        return true;
      }
    }
  );

  assert.deepEqual(received, ['day']);
  assert.equal(choice?.next, 'day_selected');
});

test('dialogue choice can switch weather without overwriting time-of-day context responsibilities', () => {
  const received = [];

  const choice = resolveDialogueChoice({
    id: 'weather_branch',
    text: '閭ｅ氨缁欏涵闄㈡坊涓€鐐瑰ぉ姘斿惂銆?',
    choices: [
      {
        id: 'switch_to_rain',
        label: '闆ㄥぉ',
        next: 'rain_selected',
        weatherChange: {
          weatherId: 'rain'
        }
      }
    ]
  }, 'switch_to_rain', {
    setWeather: (weatherId) => {
      received.push(weatherId);
      return true;
    }
  });

  assert.deepEqual(received, ['rain']);
  assert.equal(choice?.next, 'rain_selected');
});

test('dialogue choice can clear weather overlays through setWeather context', () => {
  const received = [];

  const choice = resolveDialogueChoice({
    id: 'weather_branch',
    text: '鎶婂ぉ姘旀敹鍥炲幓鍚с€?',
    choices: [
      {
        id: 'switch_to_clear',
        label: '鎶婂ぉ姘旀敹鍥炲幓',
        next: 'clear_weather_selected',
        weatherChange: {
          weatherId: 'clear'
        }
      }
    ]
  }, 'switch_to_clear', {
    setWeather: (weatherId) => {
      received.push(weatherId);
      return true;
    }
  });

  assert.deepEqual(received, ['clear']);
  assert.equal(choice?.next, 'clear_weather_selected');
});

test('dialogue choice can push a notification through execution context', () => {
  const received = [];

  const choice = resolveDialogueChoice({
    id: 'notification_branch',
    text: '瑕佷笉瑕侀『鎵嬭瘯璇曢€氱煡锛?',
    choices: [
      {
        id: 'test_gain_notification',
        label: '娴嬭瘯鑾峰緱鎻愮ず',
        next: 'gain_notification_selected',
        notification: {
          text: '浣犱粠鐠冮煶鎵嬮噷鎺ヨ繃浜嗕竴灏忔潫寰厜鑺便€?',
          type: 'gain'
        }
      }
    ]
  }, 'test_gain_notification', {
    pushNotification: (notification) => {
      received.push(notification);
      return true;
    }
  });

  assert.deepEqual(received, [{
    text: '浣犱粠鐠冮煶鎵嬮噷鎺ヨ繃浜嗕竴灏忔潫寰厜鑺便€?',
    type: 'gain'
  }]);
  assert.equal(choice?.next, 'gain_notification_selected');
});

test('dialogue choice can switch the global player portrait through execution context', () => {
  const received = [];

  const choice = resolveDialogueChoice({
    id: 'bed_branch',
    text: '瑕佹€庝箞浼戞伅锛?',
    choices: [
      {
        id: 'sleep_on_bed',
        label: '涓婂簥浼戞伅',
        next: 'sleep_on_bed_selected',
        playerPortraitChange: {
          portraitKey: 'portrait_liluo_sleep'
        }
      }
    ]
  }, 'sleep_on_bed', {
    setPlayerPortrait: (portraitKey) => {
      received.push(portraitKey);
      return true;
    }
  });

  assert.deepEqual(received, ['portrait_liluo_sleep']);
  assert.equal(choice?.next, 'sleep_on_bed_selected');
});

test('dialogue choice can switch the global player appearance through execution context', () => {
  const received = [];

  const choice = resolveDialogueChoice({
    id: 'bed_branch',
    text: '瑕佹€庝箞浼戞伅锛?',
    choices: [
      {
        id: 'sleep_in_tie_bag',
        label: '浣撻獙涓嬫嫎鏉熺潯琚嬩紤鎭?',
        next: 'sleep_in_tie_bag_selected',
        playerAppearanceChange: {
          appearanceId: 'full_body_bondage'
        }
      }
    ]
  }, 'sleep_in_tie_bag', {
    setPlayerAppearance: (appearanceId) => {
      received.push(appearanceId);
      return true;
    }
  });

  assert.deepEqual(received, ['full_body_bondage']);
  assert.equal(choice?.next, 'sleep_in_tie_bag_selected');
});

test('dialogue choice can switch the global player status through execution context', () => {
  const received = [];

  const choice = resolveDialogueChoice({
    id: 'bed_branch',
    text: '瑕佹€庝箞浼戞伅锛?',
    choices: [
      {
        id: 'sleep_in_tie_bag',
        label: '浣撻獙涓嬫嫎鏉熺潯琚嬩紤鎭?',
        next: 'sleep_in_tie_bag_selected',
        playerStatusChange: {
          status: ['no_shoes']
        }
      }
    ]
  }, 'sleep_in_tie_bag', {
    setPlayerStatus: (statusList) => {
      received.push([...statusList]);
      return true;
    }
  });

  assert.deepEqual(received, [['no_shoes']]);
  assert.equal(choice?.next, 'sleep_in_tie_bag_selected');
});

test('dialogue choice can append to the current global player status through execution context', () => {
  const received = [];

  const choice = resolveDialogueChoice({
    id: 'status_branch',
    text: '瑕佹坊鍔犲摢涓姸鎬侊紵',
    choices: [
      {
        id: 'add_hands_bound',
        label: '娣诲姞鍙屾墜琚細鐘舵€?',
        playerStatusChange: {
          mode: 'append',
          status: ['hands_bound']
        }
      }
    ]
  }, 'add_hands_bound', {
    getPlayerStatus: () => ['no_shoes'],
    setPlayerStatus: (statusList) => {
      received.push([...statusList]);
      return true;
    }
  });

  assert.deepEqual(received, [['no_shoes', 'hands_bound']]);
  assert.equal(choice?.next, undefined);
});

test('dialogue choice can set a map session flag through execution context', () => {
  const received = [];

  const choice = resolveDialogueChoice({
    id: 'bed_branch',
    text: '瑕佹€庝箞浼戞伅锛?',
    choices: [
      {
        id: 'sleep_on_bed',
        label: '涓婂簥浼戞伅',
        next: 'sleep_on_bed_selected',
        mapSessionFlagChange: {
          flagId: 'has_slept',
          value: true
        }
      }
    ]
  }, 'sleep_on_bed', {
    setMapSessionFlag: (flagId, value) => {
      received.push({ flagId, value });
      return true;
    }
  });

  assert.deepEqual(received, [{ flagId: 'has_slept', value: true }]);
  assert.equal(choice?.next, 'sleep_on_bed_selected');
});

test('dialogue choice can start an interactive fiction scenario through execution context', () => {
  const received = [];

  const choice = resolveDialogueChoice({
    id: 'start',
    choices: [
      {
        id: 'start_story_instance',
        label: '娴嬭瘯浜掑姩灏忚',
        interactiveFictionStart: {
          scenarioId: 'asylum_for_lunatic'
        }
      }
    ]
  }, 'start_story_instance', {
    startInteractiveFiction: (scenarioId) => {
      received.push(scenarioId);
      return true;
    }
  });

  assert.deepEqual(received, ['asylum_for_lunatic']);
  assert.equal(choice?.next, undefined);
});

test('dialogue choice can start a direction pad mini game through execution context', () => {
  const received = [];

  const choice = resolveDialogueChoice({
    id: 'function_test_branch',
    choices: [
      {
        id: 'start_direction_pad_test',
        label: '娴嬭瘯鏂瑰悜閿皬娓告垙',
        directionPadGameStart: {
          gameId: 'liyin_direction_pad_test'
        }
      }
    ]
  }, 'start_direction_pad_test', {
    startDirectionPadGame: (gameId) => {
      received.push(gameId);
      return true;
    }
  });

  assert.deepEqual(received, ['liyin_direction_pad_test']);
  assert.equal(choice?.next, undefined);
});

test('dialogue choice can play a sound effect through execution context', () => {
  const received = [];

  const choice = resolveDialogueChoice({
    id: 'sound_effect_test_branch',
    choices: [
      {
        id: 'play_zip_tie_tighten_1',
        label: '测试扎带音效 1',
        next: 'sound_effect_test_branch',
        soundEffectPlay: {
          key: 'sfx_zip_tie_tighten_1'
        }
      }
    ]
  }, 'play_zip_tie_tighten_1', {
    playSoundEffect: (key) => {
      received.push(key);
      return true;
    }
  });

  assert.deepEqual(received, ['sfx_zip_tie_tighten_1']);
  assert.equal(choice?.next, 'sound_effect_test_branch');
});

test('direction pad game runner completes with error statistics instead of failing early', () => {
  const runner = new DirectionPadGameRunner(directionPadGameRegistry);
  const startPayload = runner.startGame('liyin_direction_pad_test');

  assert.equal(startPayload?.state.status, 'playing');
  assert.equal(startPayload?.nextInput, 'up');
  assert.equal(startPayload?.errorCount, 0);
  assert.equal(startPayload?.errorRate, 0);

  const firstPayload = runner.pressDirection(startPayload.state, 'up');
  assert.equal(firstPayload?.state.status, 'playing');
  assert.equal(firstPayload?.nextInput, 'left');

  let payload = runner.pressDirection(firstPayload.state, 'right');
  assert.equal(payload?.state.status, 'playing');
  assert.equal(payload?.nextInput, 'down');
  assert.equal(payload?.errorCount, 1);
  assert.equal(payload?.errorRate, 0.5);

  for (const direction of directionPadGameRegistry.liyin_direction_pad_test.targetSequence.slice(2)) {
    payload = runner.pressDirection(payload.state, direction);
  }

  assert.equal(payload?.state.status, 'success');
  assert.equal(payload?.nextInput, null);
  assert.equal(payload?.errorCount, 1);
  assert.equal(payload?.errorRate, 1 / directionPadGameRegistry.liyin_direction_pad_test.targetSequence.length);

  payload = runner.startGame('liyin_direction_pad_test');

  for (const direction of directionPadGameRegistry.liyin_direction_pad_test.targetSequence) {
    payload = runner.pressDirection(payload.state, direction);
  }

  assert.equal(payload?.state.status, 'success');
  assert.equal(payload?.nextInput, null);
  assert.equal(payload?.errorCount, 0);
  assert.equal(payload?.errorRate, 0);
});

test('rhythm direction pad game runner judges input by timing window', () => {
  const runner = new DirectionPadGameRunner({
    rhythm_test: {
      id: 'rhythm_test',
      title: 'Rhythm Test',
      description: 'Test rhythm timing.',
      mode: 'rhythm',
      rhythm: {
        leadInMs: 1000,
        noteSpacingMs: 500,
        hitWindowMs: 120
      },
      targetSequence: ['up', 'left', 'right']
    }
  });
  const startPayload = runner.startGame('rhythm_test', 10_000);

  assert.equal(startPayload?.state.status, 'playing');
  assert.equal(startPayload?.nextInput, 'up');
  assert.equal(startPayload?.currentNoteIndex, 0);

  const firstPayload = runner.pressDirection(startPayload.state, 'up', 11_080);
  assert.equal(firstPayload?.state.status, 'playing');
  assert.equal(firstPayload?.nextInput, 'left');
  assert.equal(firstPayload?.currentNoteIndex, 1);
  assert.equal(firstPayload?.errorCount, 0);
  assert.equal(firstPayload?.state.resolvedNotes?.[0].result, 'hit');
  assert.equal(firstPayload?.state.resolvedNotes?.[0].timingOffsetMs, 80);

  const earlyPayload = runner.pressDirection(firstPayload.state, 'left', 11_250);
  assert.equal(earlyPayload?.state.status, 'playing');
  assert.equal(earlyPayload?.nextInput, 'left');
  assert.equal(earlyPayload?.errorCount, 1);
  assert.equal(earlyPayload?.errorRate, 0.5);
  assert.equal(earlyPayload?.state.resolvedNotes?.length, 1);
  assert.equal(earlyPayload?.state.activeNote?.result, 'miss');
  assert.equal(earlyPayload?.state.activeNote?.timingOffsetMs, -250);

  const settledEarlyPayload = runner.resolveExpiredNotes(earlyPayload.state, 11_500);
  assert.equal(settledEarlyPayload?.state.status, 'playing');
  assert.equal(settledEarlyPayload?.nextInput, 'right');
  assert.equal(settledEarlyPayload?.errorCount, 1);
  assert.equal(settledEarlyPayload?.errorRate, 0.5);
  assert.equal(settledEarlyPayload?.state.resolvedNotes?.[1].result, 'miss');
  assert.equal(settledEarlyPayload?.state.resolvedNotes?.[1].timingOffsetMs, -250);

  const wrongDirectionPayload = runner.pressDirection(settledEarlyPayload.state, 'down', 12_000);
  assert.equal(wrongDirectionPayload?.state.status, 'success');
  assert.equal(wrongDirectionPayload?.nextInput, null);
  assert.equal(wrongDirectionPayload?.errorCount, 2);
  assert.equal(wrongDirectionPayload?.errorRate, 2 / 3);
  assert.equal(wrongDirectionPayload?.state.resolvedNotes?.[2].expected, 'right');
  assert.equal(wrongDirectionPayload?.state.resolvedNotes?.[2].result, 'miss');
});

test('rhythm direction pad game runner waits for countdown before accepting input', () => {
  const runner = new DirectionPadGameRunner({
    rhythm_test: {
      id: 'rhythm_test',
      title: 'Rhythm Test',
      description: 'Test rhythm countdown.',
      mode: 'rhythm',
      rhythm: {
        leadInMs: 1000,
        noteSpacingMs: 500,
        hitWindowMs: 120
      },
      countdownDurationMs: 3000,
      targetSequence: ['up', 'left']
    }
  });
  const startPayload = runner.startGame('rhythm_test', 10_000);

  assert.equal(startPayload?.state.status, 'countdown');
  assert.equal(startPayload?.state.countdownEndsAtMs, 13_000);
  assert.equal(startPayload?.nextInput, null);

  const earlyPressPayload = runner.pressDirection(startPayload.state, 'up', 11_000);
  assert.equal(earlyPressPayload?.state.status, 'countdown');
  assert.equal(earlyPressPayload?.state.inputSequence.length, 0);
  assert.equal(earlyPressPayload?.currentNoteIndex, 0);

  const beforeCountdownEndsPayload = runner.completeCountdown(startPayload.state, 12_999);
  assert.equal(beforeCountdownEndsPayload?.state.status, 'countdown');
  assert.equal(beforeCountdownEndsPayload?.nextInput, null);

  const readyPayload = runner.completeCountdown(startPayload.state, 13_000);
  assert.equal(readyPayload?.state.status, 'playing');
  assert.equal(readyPayload?.state.startedAtMs, 13_000);
  assert.equal(readyPayload?.nextInput, 'up');

  const firstPayload = runner.pressDirection(readyPayload.state, 'up', 14_080);
  assert.equal(firstPayload?.state.resolvedNotes?.[0].result, 'hit');
  assert.equal(firstPayload?.state.resolvedNotes?.[0].timingOffsetMs, 80);
});

test('rhythm direction pad game runner keeps repeated pre-line presses on current note', () => {
  const runner = new DirectionPadGameRunner({
    rhythm_test: {
      id: 'rhythm_test',
      title: 'Rhythm Test',
      description: 'Test rhythm repeated pre-line presses.',
      mode: 'rhythm',
      rhythm: {
        leadInMs: 1000,
        noteSpacingMs: 500,
        hitWindowMs: 120
      },
      targetSequence: ['up', 'left', 'right']
    }
  });
  const startPayload = runner.startGame('rhythm_test', 10_000);

  const firstEarlyPayload = runner.pressDirection(startPayload.state, 'down', 10_700);
  assert.equal(firstEarlyPayload?.currentNoteIndex, 0);
  assert.equal(firstEarlyPayload?.nextInput, 'up');
  assert.equal(firstEarlyPayload?.errorCount, 1);
  assert.equal(firstEarlyPayload?.state.resolvedNotes?.length, 0);
  assert.equal(firstEarlyPayload?.state.activeNote?.expected, 'up');
  assert.equal(firstEarlyPayload?.state.activeNote?.result, 'miss');

  const secondEarlyPayload = runner.pressDirection(firstEarlyPayload.state, 'right', 10_850);
  assert.equal(secondEarlyPayload?.currentNoteIndex, 0);
  assert.equal(secondEarlyPayload?.nextInput, 'up');
  assert.equal(secondEarlyPayload?.errorCount, 1);
  assert.equal(secondEarlyPayload?.state.resolvedNotes?.length, 0);
  assert.equal(secondEarlyPayload?.state.activeNote?.expected, 'up');
  assert.equal(secondEarlyPayload?.state.activeNote?.input, 'right');

  const correctedBeforeLinePayload = runner.pressDirection(secondEarlyPayload.state, 'up', 10_950);
  assert.equal(correctedBeforeLinePayload?.currentNoteIndex, 0);
  assert.equal(correctedBeforeLinePayload?.errorCount, 0);
  assert.equal(correctedBeforeLinePayload?.state.resolvedNotes?.length, 0);
  assert.equal(correctedBeforeLinePayload?.state.activeNote?.result, 'hit');

  const settledPayload = runner.resolveExpiredNotes(correctedBeforeLinePayload.state, 11_000);
  assert.equal(settledPayload?.currentNoteIndex, 1);
  assert.equal(settledPayload?.nextInput, 'left');
  assert.equal(settledPayload?.errorCount, 0);
  assert.equal(settledPayload?.state.activeNote, undefined);
  assert.equal(settledPayload?.state.resolvedNotes?.[0].expected, 'up');
  assert.equal(settledPayload?.state.resolvedNotes?.[0].result, 'hit');
});

test('rhythm direction pad game runner marks expired notes as missed', () => {
  const runner = new DirectionPadGameRunner({
    rhythm_test: {
      id: 'rhythm_test',
      title: 'Rhythm Test',
      description: 'Test rhythm expiration.',
      mode: 'rhythm',
      rhythm: {
        leadInMs: 1000,
        noteSpacingMs: 500,
        hitWindowMs: 120
      },
      targetSequence: ['up', 'left', 'right']
    }
  });
  const startPayload = runner.startGame('rhythm_test', 10_000);

  const beforeWindowEndsPayload = runner.resolveExpiredNotes(startPayload.state, 11_120);
  assert.equal(beforeWindowEndsPayload?.state.status, 'playing');
  assert.equal(beforeWindowEndsPayload?.currentNoteIndex, 0);
  assert.equal(beforeWindowEndsPayload?.errorCount, 0);

  const firstMissPayload = runner.resolveExpiredNotes(startPayload.state, 11_121);
  assert.equal(firstMissPayload?.state.status, 'playing');
  assert.equal(firstMissPayload?.currentNoteIndex, 1);
  assert.equal(firstMissPayload?.nextInput, 'left');
  assert.equal(firstMissPayload?.errorCount, 1);
  assert.equal(firstMissPayload?.state.resolvedNotes?.[0].input, null);
  assert.equal(firstMissPayload?.state.resolvedNotes?.[0].expected, 'up');
  assert.equal(firstMissPayload?.state.resolvedNotes?.[0].result, 'miss');

  const caughtUpPayload = runner.resolveExpiredNotes(firstMissPayload.state, 12_700);
  assert.equal(caughtUpPayload?.state.status, 'success');
  assert.equal(caughtUpPayload?.nextInput, null);
  assert.equal(caughtUpPayload?.errorCount, 3);
  assert.equal(caughtUpPayload?.errorRate, 1);
});

test('live direction pad registry exposes LiYin rhythm mode settings', () => {
  const definition = directionPadGameRegistry.liyin_direction_pad_rhythm_test;

  assert.equal(definition.id, 'liyin_direction_pad_rhythm_test');
  assert.equal(definition.mode, 'rhythm');
  assert.equal(definition.rhythm?.leadInMs, 1200);
  assert.equal(definition.rhythm?.noteSpacingMs, 760);
  assert.equal(definition.rhythm?.hitWindowMs, 180);
  assert.equal(definition.rhythm?.hitLinePercent, 68);
  assert.equal(definition.countdownDurationMs, 3000);
  assert.equal(definition.targetSequence.length, 8);
});

test('live liluo estate LiYin root exposes a scene test branch', () => {
  const startNode = liluoEstateDialogues.estate_time_of_day_selection?.nodes?.start;
  const choice = startNode?.choices?.find((candidate) => candidate.id === 'go_to_scene_test_branch');

  assert.ok(choice, 'LiYin root should expose a scene test branch');
  assert.equal(choice.label, '场景测试');
  assert.equal(choice.next, 'scene_test_branch');
});

test('live liluo estate LiYin scene branch exposes scene-like test entries', () => {
  const sceneBranchNode = liluoEstateDialogues.estate_time_of_day_selection?.nodes?.scene_test_branch;
  const interactiveFictionChoice = sceneBranchNode?.choices?.find(
    (candidate) => candidate.id === 'start_asylum_for_lunatic_interactive_fiction'
  );
  const directionPadChoice = sceneBranchNode?.choices?.find((candidate) => candidate.id === 'start_direction_pad_test');
  const rhythmDirectionPadChoice = sceneBranchNode?.choices?.find(
    (candidate) => candidate.id === 'start_direction_pad_rhythm_test'
  );

  assert.ok(interactiveFictionChoice, 'scene test branch should expose an interactive fiction entry');
  assert.equal(interactiveFictionChoice.label, '测试互动小说');
  assert.deepEqual(interactiveFictionChoice.interactiveFictionStart, { scenarioId: 'asylum_for_lunatic' });

  assert.ok(directionPadChoice, 'scene test branch should expose a direction pad entry');
  assert.equal(directionPadChoice.label, '测试方向键小游戏');
  assert.deepEqual(directionPadChoice.directionPadGameStart, { gameId: 'liyin_direction_pad_test' });

  assert.ok(rhythmDirectionPadChoice, 'scene test branch should expose a rhythm direction pad entry');
  assert.equal(rhythmDirectionPadChoice.label, '测试进阶方向键小游戏');
  assert.deepEqual(rhythmDirectionPadChoice.directionPadGameStart, { gameId: 'liyin_direction_pad_rhythm_test' });
});

test('live liluo estate LiYin function branch exposes sound effect test choices', () => {
  const functionBranchNode = liluoEstateDialogues.estate_time_of_day_selection?.nodes?.function_test_branch;
  const soundBranchChoice = functionBranchNode?.choices?.find(
    (candidate) => candidate.id === 'go_to_sound_effect_test_branch'
  );
  const soundBranchNode = liluoEstateDialogues.estate_time_of_day_selection?.nodes?.sound_effect_test_branch;
  const audioAssetKeys = new Set(
    liluoEstateAssetBundle.manifest
      .filter((asset) => asset.type === 'audio')
      .map((asset) => asset.key)
  );
  const expectedSoundChoices = [
    ['play_zip_tie_tighten_1', '扎带收紧 1', 'sfx_zip_tie_tighten_1'],
    ['play_zip_tie_tighten_2', '扎带收紧 2', 'sfx_zip_tie_tighten_2'],
    ['play_zip_tie_tighten_3', '扎带收紧 3', 'sfx_zip_tie_tighten_3'],
    ['play_zip_tie_tighten_4', '扎带收紧 4', 'sfx_zip_tie_tighten_4'],
    ['play_leg_shackle', '脚镣声', 'sfx_leg_shackle']
  ];

  assert.ok(soundBranchChoice, 'function branch should expose a sound effect test entry');
  assert.equal(soundBranchChoice.label, '测试细节音效');
  assert.equal(soundBranchChoice.next, 'sound_effect_test_branch');
  assert.ok(soundBranchNode, 'sound effect test branch should exist');

  for (const [choiceId, label, soundKey] of expectedSoundChoices) {
    const choice = soundBranchNode.choices?.find((candidate) => candidate.id === choiceId);
    const received = [];

    assert.ok(choice, `missing sound effect choice: ${choiceId}`);
    assert.equal(choice.label, label);
    assert.deepEqual(choice.soundEffectPlay, { key: soundKey });
    assert.equal(choice.next, 'sound_effect_test_branch');
    assert.equal(audioAssetKeys.has(soundKey), true);

    resolveDialogueChoice(soundBranchNode, choiceId, {
      playSoundEffect: (key) => {
        received.push(key);
        return true;
      }
    });

    assert.deepEqual(received, [soundKey]);
  }
});

test('live liluo estate LiYin function branch exposes separate player status choices that end dialogue', () => {
  const functionBranchNode = liluoEstateDialogues.estate_time_of_day_selection?.nodes?.function_test_branch;
  const statusBranchChoice = functionBranchNode?.choices?.find(
    (candidate) => candidate.id === 'go_to_player_status_test_branch'
  );

  assert.ok(statusBranchChoice, 'function branch should expose a player status test entry');
  assert.equal(statusBranchChoice.label, '测试人物状态');
  assert.equal(statusBranchChoice.next, 'player_status_test_selected');
  assert.equal(statusBranchChoice.playerStatusChange, undefined);

  const statusNode = liluoEstateDialogues.estate_time_of_day_selection?.nodes?.player_status_test_selected;
  const expectedStatusChoiceIds = playerStatusDefinitions.map((status) => `apply_player_status_${status.id}`);
  const statusChoices = statusNode?.choices?.filter((choice) => choice.id.startsWith('apply_player_status_')) ?? [];

  assert.deepEqual(statusChoices.map((choice) => choice.id), expectedStatusChoiceIds);

  for (const status of playerStatusDefinitions) {
    const received = [];
    const choiceId = `apply_player_status_${status.id}`;
    const statusChoice = statusNode?.choices?.find((choice) => choice.id === choiceId);

    assert.ok(statusChoice, `missing player status choice: ${choiceId}`);
    assert.deepEqual(statusChoice.playerStatusChange, { mode: 'append', status: [status.id] });
    assert.equal(statusChoice.next, undefined);

    const currentStatus = ['already_active_status'];
    const resolvedChoice = resolveDialogueChoice(statusNode, choiceId, createNoopPlayerRuntimeExecutionContext({
      getPlayerStatus: () => currentStatus,
      setPlayerStatus: (statusList) => {
        received.push([...statusList]);
        return true;
      }
    }));

    assert.deepEqual(received, [[...currentStatus, status.id]]);
    assert.equal(resolvedChoice?.next, undefined);
  }

  const applyAllChoice = statusNode?.choices?.find((choice) => choice.id === 'apply_all_player_statuses');
  const receivedAll = [];
  const currentStatus = ['already_active_status'];

  assert.ok(applyAllChoice, 'player status test should expose an apply-all choice');
  assert.equal(applyAllChoice.label, '添加所有状态');
  assert.deepEqual(applyAllChoice.playerStatusChange, {
    mode: 'append',
    status: playerStatusDefinitions.map((status) => status.id)
  });
  assert.equal(applyAllChoice.next, undefined);

  const resolvedApplyAllChoice = resolveDialogueChoice(statusNode, 'apply_all_player_statuses', createNoopPlayerRuntimeExecutionContext({
    getPlayerStatus: () => currentStatus,
    setPlayerStatus: (statusList) => {
      receivedAll.push([...statusList]);
      return true;
    }
  }));

  assert.deepEqual(receivedAll, [[...currentStatus, ...playerStatusDefinitions.map((status) => status.id)]]);
  assert.equal(resolvedApplyAllChoice?.next, undefined);

  const clearChoice = statusNode?.choices?.at(-1);
  const received = [];

  assert.equal(clearChoice?.id, 'clear_player_status_test');
  assert.deepEqual(clearChoice?.playerStatusChange, { status: [] });
  assert.equal(clearChoice?.next, 'player_status_cleared');

  const resolvedClearChoice = resolveDialogueChoice(statusNode, 'clear_player_status_test', createNoopPlayerRuntimeExecutionContext({
    setPlayerStatus: (statusList) => {
      received.push([...statusList]);
      return true;
    }
  }));

  assert.deepEqual(received, [[]]);
  assert.equal(resolvedClearChoice?.next, 'player_status_cleared');

  const clearedNode = liluoEstateDialogues.estate_time_of_day_selection?.nodes?.player_status_cleared;

  assert.ok(clearedNode, 'player status clear branch should expose a follow-up node');
  assert.deepEqual(clearedNode.choices, [
    {
      id: 'return_to_player_status_test',
      label: '继续添加状态',
      next: 'player_status_test_selected'
    },
    {
      id: 'leave_player_status_test',
      label: '结束对话'
    }
  ]);
});

test('interactive fiction runner can start asylum for lunatic and progress choices with clues and tasks', () => {
  const runner = new InteractiveFictionRunner({
    [asylumForLunaticInteractiveFictionScenario.id]: asylumForLunaticInteractiveFictionScenario
  });

  const startPayload = runner.startScenario('asylum_for_lunatic');
  assert.equal(startPayload?.node.id, 'start');

  const prologuePayload = runner.selectChoice(startPayload.state, 'begin_story');
  assert.equal(prologuePayload?.node.id, 'start1');
  assert.deepEqual(prologuePayload?.activeTasks.map((task) => task.id), ['escape_hospital']);

  const roomPayload = runner.selectChoice(prologuePayload.state, 'inspect_room');
  assert.equal(roomPayload?.node.id, '2011_1');
  assert.deepEqual(roomPayload?.visibleClues.map((clue) => clue.id), ['patient_room']);
});

test('interactive fiction runner records node flags when reaching endings', () => {
  const runner = new InteractiveFictionRunner({
    [asylumForLunaticInteractiveFictionScenario.id]: asylumForLunaticInteractiveFictionScenario
  });
  const baseState = {
    scenarioId: 'asylum_for_lunatic',
    nodeId: 'continue_7',
    visitedNodeIds: ['start', 'continue_7'],
    revealedClueIds: [],
    activeTaskIds: [],
    completedTaskIds: [],
    flags: {}
  };

  const successPayload = runner.selectChoice(baseState, 'search_room_after_dean');
  assert.equal(successPayload?.node.id, 'continue_8');
  assert.deepEqual(successPayload?.state.flags, {
    escapeResult: 'success',
    scenarioCompleted: true
  });

  const failedPayload = runner.selectChoice(baseState, 'continue_7_choice_1');
  assert.equal(failedPayload?.node.id, 'end_dean');
  assert.deepEqual(failedPayload?.state.flags, {
    escapeResult: 'failure',
    scenarioCompleted: true
  });
});

test('asylum for lunatic scenario has a complete legacy Chamber1 flow graph', () => {
  const scenario = asylumForLunaticInteractiveFictionScenario;
  const failedEndingNodeIds = ['end_constraint', 'end_couple', 'end_statuary', 'end_dean'];
  const expectedNodeIds = [
    'start',
    'start1',
    '2011_1',
    'floor_road',
    'case_book',
    'continue_1',
    'note_book',
    'continue_2',
    'continue_3',
    'floor_road_1',
    'washroom',
    'continue_4',
    'continue_5',
    'recreation_room',
    'continue_6',
    'psychological_counseling',
    'feed',
    'continue_7',
    'continue_8',
    'end_constraint',
    'end_couple',
    'end_statuary',
    'end_dean'
  ];

  assert.equal(scenario.id, 'asylum_for_lunatic');
  assert.deepEqual(Object.keys(scenario.nodes), expectedNodeIds);
  assert.equal(scenario.startNodeId, 'start');

  for (const node of Object.values(scenario.nodes)) {
    assert.ok(node.paragraphs.length > 0, `${node.id} should have paragraphs`);

    for (const choice of node.choices ?? []) {
      assert.ok(scenario.nodes[choice.next], `${node.id}:${choice.id} points to missing ${choice.next}`);
      assert.notEqual(choice.next, 'start', `${node.id}:${choice.id} should use the fixed restart button instead`);
    }
  }

  for (const nodeId of failedEndingNodeIds) {
    const node = scenario.nodes[nodeId];

    assert.ok(node.paragraphs.at(-1)?.startsWith('【逃生失败】'), `${nodeId} should mark the route as failed`);
    assert.deepEqual(node.setFlags, {
      escapeResult: 'failure',
      scenarioCompleted: true
    });
    assert.equal(node.choices, undefined, `${nodeId} should not include an inline restart choice`);
  }

  assert.ok(scenario.nodes.continue_8.paragraphs.at(-1)?.startsWith('【逃生成功】'));
  assert.deepEqual(scenario.nodes.continue_8.setFlags, {
    escapeResult: 'success',
    scenarioCompleted: true
  });
});

test('event can show fallback dialogue when a map session flag no longer matches', () => {
  const result = executeEventActions({
    eventId: 'liluo_room_bed_event',
    triggerType: 'manual',
    dialogueId: 'liluo_room_bed_dialogue',
    mapSessionFlagRequired: {
      flagId: 'has_slept',
      expected: false,
      fallbackDialogueId: 'liluo_room_bed_already_slept'
    }
  }, {
    getMapSessionFlag: (flagId) => {
      assert.equal(flagId, 'has_slept');
      return true;
    }
  }, {
    resolveDialogue: (dialogueId) => ({
      id: dialogueId,
      nodeId: 'start',
      text: '鐜板湪鏆傛椂涓嶆兂鐫¤浜嗐€?',
      choices: [],
      canAdvance: false
    })
  });

  assert.equal(result.didExecute, true);
  assert.equal(result.dialogue?.id, 'liluo_room_bed_already_slept');
  assert.equal(result.dialogue?.text, '鐜板湪鏆傛椂涓嶆兂鐫¤浜嗐€?');
});

test('dialogue choice can declare a reusable cutscene before the next dialogue node', () => {
  const choice = resolveDialogueChoice({
    id: 'bed_branch',
    choices: [
      {
        id: 'sleep_on_bed',
        label: '涓婂簥浼戞伅',
        next: 'sleep_on_bed_selected',
        cutscene: {
          type: 'fade_message',
          text: '涓€澶滄棤璇濃€︹€?',
          holdMs: 2000
        }
      }
    ]
  }, 'sleep_on_bed');

  assert.deepEqual(choice?.cutscene, {
    type: 'fade_message',
    text: '涓€澶滄棤璇濃€︹€?',
    holdMs: 2000
  });
});

test('live liluo_room bed dialogue no longer switches appearance directly for restrained sleep', () => {
  const received = [];
  const startNode = liluoRoomDialogues.liluo_room_bed_dialogue?.nodes?.start;

  assert.ok(startNode, 'liluo_room_bed_dialogue.start 搴斿瓨鍦?');

  const choice = resolveDialogueChoice(startNode, 'sleep_in_tie_bag', createNoopPlayerRuntimeExecutionContext({
    setPlayerAppearance: (appearanceId) => {
      received.push(appearanceId);
      return true;
    }
  }));

  assert.deepEqual(received, []);
  assert.equal(choice?.next, 'sleep_in_tie_bag_selected');
});

test('live liluo_room bed dialogue writes barefoot and restraint statuses for restrained sleep', () => {
  const received = [];
  const startNode = liluoRoomDialogues.liluo_room_bed_dialogue?.nodes?.start;

  assert.ok(startNode, 'liluo_room_bed_dialogue.start 搴斿瓨鍦?');

  const choice = resolveDialogueChoice(startNode, 'sleep_in_tie_bag', createNoopPlayerRuntimeExecutionContext({
    setPlayerStatus: (statusList) => {
      received.push([...statusList]);
      return true;
    }
  }));

  assert.deepEqual(received, [['no_shoes', 'hands_bound', 'legs_bound']]);
  assert.equal(choice?.next, 'sleep_in_tie_bag_selected');
});

test('live liluo_room bed rest choices share the sleep cutscene and wake-up line', () => {
  const dialogue = liluoRoomDialogues.liluo_room_bed_dialogue;
  const startNode = dialogue?.nodes?.start;

  assert.ok(startNode, 'liluo_room_bed_dialogue.start should exist');

  const bedChoice = resolveDialogueChoice(startNode, 'sleep_on_bed', createNoopPlayerRuntimeExecutionContext());
  const tieBagChoice = resolveDialogueChoice(startNode, 'sleep_in_tie_bag', createNoopPlayerRuntimeExecutionContext());

  assert.deepEqual(bedChoice?.cutscene, {
    type: 'fade_message',
    text: '一夜无话……',
    holdMs: bedChoice.cutscene.holdMs
  });
  assert.deepEqual(tieBagChoice?.cutscene, bedChoice?.cutscene);
  assert.equal(typeof bedChoice?.cutscene?.holdMs, 'number');
  assert.equal(dialogue.nodes.sleep_on_bed_selected.text, '这一觉睡得好舒服呀。');
  assert.match(dialogue.nodes.sleep_in_tie_bag_selected.text, /这一觉睡得好舒服/);
  assert.match(dialogue.nodes.sleep_in_tie_bag_selected.text, /./);
});

test('live liluo_room bed rest choices mark the current map session as slept', () => {
  const startNode = liluoRoomDialogues.liluo_room_bed_dialogue?.nodes?.start;
  const received = [];

  assert.ok(startNode, 'liluo_room_bed_dialogue.start should exist');

  resolveDialogueChoice(startNode, 'sleep_on_bed', createNoopPlayerRuntimeExecutionContext({
    setMapSessionFlag: (flagId, value) => {
      received.push({ flagId, value });
      return true;
    }
  }));

  resolveDialogueChoice(startNode, 'sleep_in_tie_bag', createNoopPlayerRuntimeExecutionContext({
    setMapSessionFlag: (flagId, value) => {
      received.push({ flagId, value });
      return true;
    }
  }));

  assert.deepEqual(received, [
    { flagId: 'liluo_room_has_slept', value: true },
    { flagId: 'liluo_room_has_slept', value: true }
  ]);
});

test('live liluo_room bed event falls back after sleeping in the current map session', () => {
  const bedEvent = liluoRoomEvents.liluo_room_bed_event;
  const result = executeEventActions(bedEvent, {
    getMapSessionFlag: (flagId) => {
      assert.equal(flagId, 'liluo_room_has_slept');
      return true;
    }
  }, {
    resolveDialogue: (dialogueId) => {
      const dialogue = liluoRoomDialogues[dialogueId];

      return {
        id: dialogueId,
        nodeId: 'start',
        text: dialogue.text,
        choices: [],
        canAdvance: false
      };
    }
  });

  assert.equal(result.dialogue?.id, 'liluo_room_bed_already_slept');
  assert.equal(result.dialogue?.text, '现在暂时不想睡觉了。');
});

test('live liluo_room restrained sleep wake-up can ask the maid to untie the player', () => {
  const dialogue = liluoRoomDialogues.liluo_room_bed_dialogue;
  const wakeNode = dialogue?.nodes?.sleep_in_tie_bag_selected;
  const received = {
    status: null,
    appearanceId: null,
    portraitKey: null
  };

  assert.ok(wakeNode, 'sleep_in_tie_bag_selected should exist');
  assert.match(wakeNode.text, /./);

  const choice = resolveDialogueChoice(wakeNode, 'ask_maid_to_untie', {
    setPlayerStatus: (statusList) => {
      received.status = [...statusList];
      return true;
    },
    setPlayerAppearance: (appearanceId) => {
      received.appearanceId = appearanceId;
      return true;
    },
    setPlayerPortrait: (portraitKey) => {
      received.portraitKey = portraitKey;
      return true;
    }
  });

  assert.deepEqual(received, {
    status: ['no_shoes'],
    appearanceId: null,
    portraitKey: 'portrait_liluo_sleep'
  });
  assert.equal(choice?.next, undefined);
});

test('live liluo_room restrained sleep wake-up can keep the current restrained state', () => {
  const wakeNode = liluoRoomDialogues.liluo_room_bed_dialogue?.nodes?.sleep_in_tie_bag_selected;
  const received = [];

  assert.ok(wakeNode, 'sleep_in_tie_bag_selected 搴斿瓨鍦?');

  const choice = resolveDialogueChoice(wakeNode, 'stay_tied_after_sleep', {
    setPlayerStatus: (statusList) => {
      received.push(['status', [...statusList]]);
      return true;
    },
    setPlayerAppearance: (appearanceId) => {
      received.push(['appearance', appearanceId]);
      return true;
    },
    setPlayerPortrait: (portraitKey) => {
      received.push(['portrait', portraitKey]);
      return true;
    }
  });

  assert.deepEqual(received, []);
  assert.equal(choice?.next, undefined);
});

test('bondage player appearance swaps the upper body layer in the shared appearance table', () => {
  const bondageRegistration = playerAppearanceSpriteSheets.bondage;

  assert.equal(bondageRegistration.textureKey, 'liluo_bondage_body_up_down_idle');
  assert.equal(bondageRegistration.baseFrameTextureKeyPrefix, 'LiLuo_body_down');
  assert.deepEqual(bondageRegistration.layers, [
    {
      sourceTextureKeyPrefix: 'bondage_body_up',
      mode: 'clear-base-side-pixels-within-layer-height'
    },
    {
      sourceTextureKeyPrefix: 'LiLuo_head',
      mode: 'overlay'
    }
  ]);
});

test('default player appearance uses the normal upper body layer', () => {
  const defaultRegistration = playerAppearanceSpriteSheets.default;

  assert.equal(defaultRegistration.textureKey, 'liluo_body_up_down_idle');
  assert.equal(defaultRegistration.baseFrameTextureKeyPrefix, 'LiLuo_body_down');
  assert.deepEqual(defaultRegistration.layers, [
    {
      sourceTextureKeyPrefix: 'LiLuo_body_up',
      mode: 'clear-base-side-pixels-within-layer-height'
    },
    {
      sourceTextureKeyPrefix: 'LiLuo_head',
      mode: 'overlay'
    }
  ]);
});

test('player character asset bundle preloads layered frame images without duplicate keys', () => {
  const manifestKeys = playerCharacterAssetBundle.manifest.map((entry) => entry.key);

  assert.equal(new Set(manifestKeys).size, manifestKeys.length);
  assert.ok(manifestKeys.includes('LiLuo_body_down_down_idle'));
  assert.ok(manifestKeys.includes('LiLuo_body_up_down_idle'));
  assert.ok(manifestKeys.includes('LiLuo_head_down_idle'));
  assert.ok(manifestKeys.includes('bondage_body_up_down_idle'));
  assert.ok(manifestKeys.includes('bondage_body_down_down_idle'));
  assert.ok(manifestKeys.includes('liluo_full_body_bondage'));
});

test('switching current player appearance updates the generated runtime definition directly', () => {
  resetPlayerRuntimeState();

  assert.equal(setPlayerAppearance('bondage'), 'bondage');
  assert.equal(getPlayerAppearanceId(), 'bondage');
  assert.equal(resolvePlayerRuntimeCharacterDefinition().textureKey, 'liluo_bondage_body_up_down_idle');

  resetPlayerRuntimeState();
});

test('switching current player portrait updates the resolved runtime portrait directly', () => {
  resetPlayerRuntimeState();

  assert.equal(setPlayerPortrait(globalDialoguePortraits.liLuoSleep.key), globalDialoguePortraits.liLuoSleep.key);
  assert.equal(getPlayerPortraitKey(), globalDialoguePortraits.liLuoSleep.key);
  assert.equal(resolvePlayerRuntimePortrait().key, globalDialoguePortraits.liLuoSleep.key);

  resetPlayerRuntimeState();
});

test('player runtime status label prefers explicit status over restraints', () => {
  resetPlayerRuntimeState();

  setPlayerStatus(['no_shoes', 'hands_bound']);
  setPlayerRestraints(['rope']);

  assert.equal(resolvePlayerRuntimeStatusLabel(), '未穿鞋 / 双手被缚');

  resetPlayerRuntimeState();
});

test('player runtime status label ignores restraint data when status is empty', () => {
  resetPlayerRuntimeState();

  setPlayerStatus([]);
  setPlayerRestraints(['rope']);

  assert.equal(resolvePlayerRuntimeStatusLabel(), '自由');

  resetPlayerRuntimeState();
});

test('player runtime status label falls back to default freedom label when no runtime tags exist', () => {
  resetPlayerRuntimeState();

  assert.equal(resolvePlayerRuntimeStatusLabel(), '自由');
});

test('bed dialogue rest choice keeps only barefoot status after sleeping', () => {
  resetPlayerRuntimeState();
  setPlayerStatus(['no_shoes']);

  const startNode = liluoRoomDialogues.liluo_room_bed_dialogue?.nodes?.start;

  assert.ok(startNode, 'liluo_room_bed_dialogue.start should exist');

  resolveDialogueChoice(startNode, 'sleep_on_bed', createNoopPlayerRuntimeExecutionContext({
    setPlayerStatus: (statusList) => {
      setPlayerStatus(statusList);
      return true;
    }
  }));

  assert.equal(resolvePlayerRuntimeStatusLabel(), '未穿鞋');

  resetPlayerRuntimeState();
});

test('map transition event calls changeMap context and does not require dialogue', () => {
  const received = [];

  const result = executeEventActions({
    eventId: 'estate_house_entry',
    triggerType: 'manual',
    mapTransition: {
      mapId: 'liluo_house_living_room',
      spawnId: 'role'
    }
  }, {
    changeMap: (transition) => {
      received.push(transition);
      return true;
    }
  }, {
    resolveDialogue: () => null
  });

  assert.deepEqual(received, [{ mapId: 'liluo_house_living_room', spawnId: 'role' }]);
  assert.equal(result.didExecute, true);
  assert.equal(result.dialogue, null);
});

test('city Jingjiang school enters from the role marker by default', () => {
  const roleLayer = cityJingjiangSchoolMap.layers.find((layer) => layer.name === 'role');
  const roleTileCount = (roleLayer?.chunks ?? []).reduce((count, chunk) => {
    return count + chunk.data.filter((tileId) => tileId > 0).length;
  }, 0);

  assert.equal(cityJingjiangSchoolMeta.defaultSpawnId, 'role');
  assert.ok(roleLayer, 'city_jingjiang_school should keep a role marker layer');
  assert.ok(roleTileCount > 0, 'role marker layer should contain a spawn tile');
});

test('estate parallel world portal starts adventure and enters fleeting light chapter', () => {
  const dialogue = liluoEstateDialogues.parallel_world_adventure_pending;
  const startNode = dialogue?.nodes?.start;
  const chapterNode = dialogue?.nodes?.adventure_chapter_selection;

  assert.ok(startNode, 'parallel world portal start node should exist');
  assert.ok(chapterNode, 'parallel world portal chapter selection node should exist');

  const startChoice = resolveDialogueChoice(startNode, 'start_adventure', createNoopPlayerRuntimeExecutionContext());
  assert.equal(startChoice?.label, '开始冒险');
  assert.equal(startChoice?.next, 'adventure_chapter_selection');

  const chapterChoice = resolveDialogueChoice(chapterNode, 'go_to_fleeting_light', createNoopPlayerRuntimeExecutionContext({
    changeMap: () => true
  }));
  assert.equal(chapterChoice?.label, '浮光掠影');
  assert.deepEqual(chapterChoice?.mapTransition, {
    mapId: 'city_jingjiang_school',
    spawnId: 'role'
  });
});

test('event can show fallback dialogue instead of leaving when player portrait is not default', () => {
  const result = executeEventActions({
    eventId: 'liluo_room_leave',
    triggerType: 'manual',
    defaultPlayerPortraitRequired: {
      fallbackDialogueId: 'liluo_room_leave_change_clothes_required'
    },
    mapTransition: {
      mapId: 'liluo_house_living_room',
      spawnId: 'liluo_room_event'
    }
  }, {
    isPlayerPortraitDefault: () => false,
    changeMap: () => {
      assert.fail('闈為粯璁ょ珛缁樻椂涓嶅簲鐩存帴绂诲紑鎴块棿');
    }
  }, {
    resolveDialogue: (dialogueId) => ({
      id: dialogueId,
      nodeId: 'start',
      text: '绌挎垚杩欐牱鍑哄幓涓嶅お濂藉惂锛岃繕鏄崲韬。鏈嶅惂',
      choices: [],
      canAdvance: false
    })
  });

  assert.equal(result.didExecute, true);
  assert.equal(result.dialogue?.id, 'liluo_room_leave_change_clothes_required');
  assert.equal(result.dialogue?.text, '绌挎垚杩欐牱鍑哄幓涓嶅お濂藉惂锛岃繕鏄崲韬。鏈嶅惂');
});

test('event can leave normally when required default portrait is already active', () => {
  const received = [];

  const result = executeEventActions({
    eventId: 'liluo_room_leave',
    triggerType: 'manual',
    defaultPlayerPortraitRequired: {
      fallbackDialogueId: 'liluo_room_leave_change_clothes_required'
    },
    mapTransition: {
      mapId: 'liluo_house_living_room',
      spawnId: 'liluo_room_event'
    }
  }, {
    isPlayerPortraitDefault: () => true,
    changeMap: (transition) => {
      received.push(transition);
      return true;
    }
  }, {
    resolveDialogue: () => null
  });

  assert.deepEqual(received, [{ mapId: 'liluo_house_living_room', spawnId: 'liluo_room_event' }]);
  assert.equal(result.didExecute, true);
  assert.equal(result.dialogue, null);
});

test('event can remove one player status without clearing other statuses', () => {
  const received = [];

  const result = executeEventActions({
    eventId: 'remove_no_shoes_before_leave',
    triggerType: 'manual',
    playerStatusChange: {
      mode: 'remove',
      status: ['no_shoes']
    }
  }, {
    getPlayerStatus: () => ['no_shoes', 'blind'],
    setPlayerStatus: (statusList) => {
      received.push([...statusList]);
      return true;
    }
  }, {
    resolveDialogue: () => null
  });

  assert.deepEqual(received, [['blind']]);
  assert.equal(result.didExecute, true);
  assert.equal(result.dialogue, null);
});

test('dialogue choice can restore default clothes and leave through map transition', () => {
  const received = {
    status: null,
    appearanceId: null,
    portraitKey: null,
    transition: null
  };

  const choice = resolveDialogueChoice({
    id: 'start',
    choices: [
      {
        id: 'change_clothes_and_leave',
        label: '鎹㈣韩琛ｆ湇',
        playerAppearanceChange: {
          appearanceId: 'default'
        },
        playerStatusChange: {
          mode: 'remove',
          status: ['no_shoes', 'hands_bound', 'legs_bound']
        },
        playerPortraitChange: {
          portraitKey: 'portrait_liluo_default'
        },
        mapTransition: {
          mapId: 'liluo_house_living_room',
          spawnId: 'liluo_room_event'
        }
      }
    ]
  }, 'change_clothes_and_leave', {
    getPlayerStatus: () => ['no_shoes', 'hands_bound', 'legs_bound', 'blind'],
    setPlayerStatus: (statusList) => {
      received.status = [...statusList];
      return true;
    },
    setPlayerAppearance: (appearanceId) => {
      received.appearanceId = appearanceId;
      return true;
    },
    setPlayerPortrait: (portraitKey) => {
      received.portraitKey = portraitKey;
      return true;
    },
    changeMap: (transition) => {
      received.transition = transition;
      return true;
    }
  });

  assert.deepEqual(received, {
    status: ['blind'],
    appearanceId: 'default',
    portraitKey: 'portrait_liluo_default',
    transition: {
      mapId: 'liluo_house_living_room',
      spawnId: 'liluo_room_event'
    }
  });
  assert.equal(choice?.next, undefined);
});

test('live liluo_room leave event blocks non-default portrait and offers changing clothes', () => {
  const leaveEvent = liluoRoomEvents.liluo_room_leave;
  const dialogue = liluoRoomDialogues.liluo_room_leave_change_clothes_required;
  const startNode = dialogue?.nodes?.start;

  assert.equal(
    leaveEvent?.defaultPlayerPortraitRequired?.fallbackDialogueId,
    'liluo_room_leave_change_clothes_required'
  );
  assert.ok(startNode, 'liluo_room_leave_change_clothes_required.start should exist');
  assert.equal(startNode.text, '穿成这样出去不太好吧，还是换身衣服吧');
  assert.equal(startNode.choices?.length, 1);
  assert.equal(startNode.choices?.[0]?.label, '换身衣服');
});

test('live liluo_room change-clothes choice restores defaults and leaves the room', () => {
  const startNode = liluoRoomDialogues.liluo_room_leave_change_clothes_required?.nodes?.start;
  const choice = startNode?.choices?.[0];

  assert.ok(choice, 'change-clothes choice should exist');
  assert.deepEqual(choice.playerStatusChange, { mode: 'remove', status: ['no_shoes', 'hands_bound', 'legs_bound'] });
  assert.equal(choice.playerAppearanceChange, undefined);
  assert.deepEqual(choice.playerPortraitChange, { portraitKey: 'portrait_liluo_default' });
  assert.deepEqual(choice.mapTransition, {
    mapId: 'liluo_house_living_room',
    spawnId: 'liluo_room_event'
  });
});

test('live liluo_room leave event removes barefoot and restraint statuses before leaving', () => {
  const leaveEvent = liluoRoomEvents.liluo_room_leave;
  const received = {
    status: null,
    transition: null
  };

  const result = executeEventActions(leaveEvent, {
    isPlayerPortraitDefault: () => true,
    getPlayerStatus: () => ['no_shoes', 'hands_bound', 'legs_bound', 'blind'],
    setPlayerStatus: (statusList) => {
      received.status = [...statusList];
      return true;
    },
    changeMap: (transition) => {
      received.transition = transition;
      return true;
    }
  }, {
    resolveDialogue: () => null
  });

  assert.deepEqual(received, {
    status: ['blind'],
    transition: {
      mapId: 'liluo_house_living_room',
      spawnId: 'liluo_room_event'
    }
  });
  assert.equal(result.didExecute, true);
  assert.equal(result.dialogue, null);
});

test('portrait event calls setPlayerPortrait context and does not require dialogue', () => {
  const received = [];

  const result = executeEventActions({
    eventId: 'liluo_room_bed_sleep_preview',
    triggerType: 'manual',
    playerPortraitChange: {
      portraitKey: 'portrait_liluo_sleep_tie'
    }
  }, {
    setPlayerPortrait: (portraitKey) => {
      received.push(portraitKey);
      return true;
    }
  }, {
    resolveDialogue: () => null
  });

  assert.deepEqual(received, ['portrait_liluo_sleep_tie']);
  assert.equal(result.didExecute, true);
  assert.equal(result.dialogue, null);
});

test('appearance event calls setPlayerAppearance context and does not require dialogue', () => {
  const received = [];

  const result = executeEventActions({
    eventId: 'liluo_room_bed_appearance_preview',
    triggerType: 'manual',
    playerAppearanceChange: {
      appearanceId: 'bondage'
    }
  }, {
    setPlayerAppearance: (appearanceId) => {
      received.push(appearanceId);
      return true;
    }
  }, {
    resolveDialogue: () => null
  });

  assert.deepEqual(received, ['bondage']);
  assert.equal(result.didExecute, true);
  assert.equal(result.dialogue, null);
});
