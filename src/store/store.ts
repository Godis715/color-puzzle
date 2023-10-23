import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

import * as levelConstructor from 'src/features/level-constructor';
import * as levels from 'src/features/levels';

const rootReducer = combineReducers({
  [levelConstructor.modelName]: levelConstructor.reducer,
  [levels.modelName]: levels.reducer,
});

const persistedRootReducer = persistReducer(
  {
    key: 'root',
    storage,
    whitelist: [],
  },
  rootReducer
);

export const store = configureStore({
  reducer: persistedRootReducer,
  devTools: process.env.NODE_ENV !== 'production',
});
