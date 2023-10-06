import { createSelector } from 'reselect';

import { LevelConstructorState, modelName } from './level-constructor-store';

export const selectLevelConstructorState = (state: Record<string, unknown>) =>
  state[modelName] as LevelConstructorState;

export const selectHoveredGroupId = createSelector(
  selectLevelConstructorState,
  (state) => state.hoveredGroupId
);
