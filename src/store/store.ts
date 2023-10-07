import { combineReducers, configureStore } from '@reduxjs/toolkit';
import * as levelConstructor from 'features/level-constructor';
import { persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

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
