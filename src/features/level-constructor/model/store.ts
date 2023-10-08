/* eslint-disable no-param-reassign */
import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

import {
  breakGroup,
  createGrouping,
  generateGroupName,
  Grouping,
  uniteGroups,
} from '../lib/grouping';
import {
  removeGraphNodes,
  renameGraphNodeIds,
  toggleGraphEdge,
  UndirectedGraph,
} from '../lib/undirected-graph';
import { toggleArrayElement } from '../lib/toggle-array-element';

export const modelName = 'levelConstructor';

export type Fragment = {
  id: string;
  data: string;
};

export type Decorations = string | null;

export type LevelConstructorState = {
  hoveredGroupId: string | null;
  activeGroupsIds: string[];
  grouping: Grouping;
  neighborsGraph: UndirectedGraph;
  fragments: Fragment[];
  decorations: Decorations;
  readyGroups: string[];
};

const initialState: LevelConstructorState = {
  hoveredGroupId: null,
  activeGroupsIds: [],
  grouping: [],
  neighborsGraph: [],
  fragments: [],
  decorations: null,
  readyGroups: [],
};

export const levelConstructorSlice = createSlice({
  name: modelName,
  initialState,
  reducers: {
    setHoveredGroupId: (state, action: PayloadAction<string | null>) => {
      state.hoveredGroupId = action.payload;
    },

    setActiveGroupId: (state, action: PayloadAction<string | null>) => {
      const { activeGroupsIds } = state;

      const groupId = action.payload;

      const isMultiSelect = activeGroupsIds.length > 1;

      const isSelfSelect = activeGroupsIds[0] !== groupId;

      state.activeGroupsIds =
        (isMultiSelect || isSelfSelect) && groupId ? [groupId] : [];
    },

    toggleActiveGroupId: (state, action: PayloadAction<string>) => {
      const { activeGroupsIds } = state;

      const groupId = action.payload;

      state.activeGroupsIds = toggleArrayElement(activeGroupsIds, groupId);
    },

    uniteActive: (state) => {
      const { activeGroupsIds, grouping, neighborsGraph } = state;

      // TOOD: change ready array, when uniting groups

      const isMultiSelect = activeGroupsIds.length > 1;

      if (!isMultiSelect) return;

      const newGroupId = generateGroupName();

      state.grouping = uniteGroups(grouping, activeGroupsIds, newGroupId);

      state.neighborsGraph = renameGraphNodeIds(
        neighborsGraph,
        activeGroupsIds,
        newGroupId
      );

      state.activeGroupsIds = [newGroupId];
    },

    breakActive: (state) => {
      const { activeGroupsIds, grouping, neighborsGraph } = state;

      // TOOD: change ready array, when breaking groups

      const isSingleSelect = activeGroupsIds.length === 1;

      if (!isSingleSelect) return;

      const activeGroupId = activeGroupsIds[0];

      state.grouping = breakGroup(grouping, activeGroupId);

      state.neighborsGraph = removeGraphNodes(neighborsGraph, [activeGroupId]);
    },

    setFragments: (state, action: PayloadAction<Fragment[]>) => {
      state.fragments = action.payload;

      state.neighborsGraph = [];

      const fragmentsIds = action.payload.map(({ id }) => id);

      state.grouping = createGrouping(fragmentsIds);
    },

    toggleNeighbor: (state, action: PayloadAction<string>) => {
      const { activeGroupsIds, neighborsGraph } = state;

      const isSingleSelect = activeGroupsIds.length === 1;

      if (!isSingleSelect) return;

      const groupId = action.payload;

      const activeGroupId = activeGroupsIds[0];

      const edge: [string, string] = [groupId, activeGroupId];

      state.neighborsGraph = toggleGraphEdge(neighborsGraph, edge);

      state.readyGroups = state.readyGroups.filter(
        (id) => id !== groupId && id !== activeGroupId
      );
    },

    setDecorations: (state, action: PayloadAction<Decorations>) => {
      state.decorations = action.payload;
    },

    toggleIsActiveGroupReady: (state) => {
      const { activeGroupsIds, readyGroups } = state;

      const isSingleSelect = activeGroupsIds.length === 1;

      if (!isSingleSelect) return;

      const groupId = activeGroupsIds[0];

      state.readyGroups = toggleArrayElement(readyGroups, groupId);
    },
  },
});

const persistWhiteList: (keyof LevelConstructorState)[] = [
  'grouping',
  'neighborsGraph',
  'fragments',
  'decorations',
  'readyGroups',
];

export const reducer = persistReducer(
  {
    key: modelName,
    storage,
    whitelist: persistWhiteList,
  },
  levelConstructorSlice.reducer
);

export const { actions } = levelConstructorSlice;
