import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

import * as levelConstructor from 'src/features/level-constructor';

const rootReducer = combineReducers({
  [levelConstructor.modelName]: levelConstructor.reducer,
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
