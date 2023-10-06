/* eslint-disable no-param-reassign */
import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export const modelName = 'levelConstructor';

export type LevelConstructorState = {
  hoveredGroupId: string | null;
};

const initialState: LevelConstructorState = {
  hoveredGroupId: null,
};

export const levelConstructorSlice = createSlice({
  name: modelName,
  initialState,
  reducers: {
    setHoveredGroupId: (state, action: PayloadAction<string | null>) => {
      state.hoveredGroupId = action.payload;
    },
  },
});

export const { actions, reducer } = levelConstructorSlice;
