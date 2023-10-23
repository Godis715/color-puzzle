/* eslint-disable no-param-reassign */
import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

import { levelsData } from '../constants';

export const modelName = 'levels';

type LevelColoring = Record<string, number>;

type Level = {
  id: string;
  foundSolutionColoring: LevelColoring | null;
  currentColoring: LevelColoring | null;
};

type Levels = Record<string, Level>;

export type LevelsState = {
  levels: Record<string, Level>;
};

const initialState: LevelsState = {
  levels: levelsData.reduce((acc, level) => {
    acc[level.id] = {
      id: level.id,
      foundSolutionColoring: null,
      currentColoring: null,
    };

    return acc;
  }, {} as Levels),
};

export const levelsSlice = createSlice({
  name: modelName,
  initialState,
  reducers: {
    setFoundSolutionColoring: (
      state,
      action: PayloadAction<{ levelId: string; coloring: LevelColoring }>
    ) => {
      const { levelId, coloring } = action.payload;

      if (!state.levels[levelId]) return;

      state.levels[levelId].foundSolutionColoring = coloring;
    },

    setCurrentColoring: (
      state,
      action: PayloadAction<{ levelId: string; coloring: LevelColoring | null }>
    ) => {
      const { levelId, coloring } = action.payload;

      if (!state.levels[levelId]) return;

      state.levels[levelId].currentColoring = coloring;
    },
  },
});

export const reducer = persistReducer(
  {
    key: modelName,
    storage,
  },
  levelsSlice.reducer
);

export const { actions } = levelsSlice;
