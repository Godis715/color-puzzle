import { createSelector } from 'reselect';

import { levelsData } from '../constants';
import { LevelsState, modelName } from './store';

export const selectLevelsState = (state: Record<string, unknown>) =>
  state[modelName] as LevelsState;

export const selectLevels = createSelector(selectLevelsState, (state) =>
  Object.values(state.levels).map((level, i, levels) => {
    const levelData = levelsData.find(({ id }) => id === level.id)!;

    return {
      ...levelData,

      isAvailable: i === 0 || !!levels[i - 1].foundSolutionColoring,
      isPassed: !!level.foundSolutionColoring,
      hasProgress: !!level.currentColoring,
      foundSolutionColoring: level.foundSolutionColoring,
      currentColoring: level.currentColoring,
    };
  })
);
