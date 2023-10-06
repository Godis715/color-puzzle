import { configureStore } from '@reduxjs/toolkit';
import { reducer as levelConstructor } from 'features/level-constructor';

export const store = configureStore({
  reducer: {
    levelConstructor,
  },
});
