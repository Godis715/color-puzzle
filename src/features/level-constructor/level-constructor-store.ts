/* eslint-disable no-param-reassign */
import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { useDispatch } from 'react-redux';
import { useMemo } from 'react';
import {
  breakGroup,
  createGrouping,
  generateGroupName,
  getGroupByElement,
  Grouping,
  uniteGroups,
} from './grouping';
import {
  removeGraphNodes,
  renameGraphNodeIds,
  toggleGraphEdge,
  UndirectedGraph,
} from './undirected-graph';

export const modelName = 'levelConstructor';

export type LevelConstructorState = {
  hoveredGroupId: string | null;
  activeGroupsIds: string[];
  grouping: Grouping;
  neighborsGraph: UndirectedGraph;
};

const initialState: LevelConstructorState = {
  hoveredGroupId: null,
  activeGroupsIds: [],
  grouping: [],
  neighborsGraph: [],
};

function toggleArrayElement<T>(array: T[], element: T): T[] {
  return array.includes(element)
    ? array.filter((elem) => elem !== element)
    : array.concat(element);
}

export const levelConstructorSlice = createSlice({
  name: modelName,
  initialState,
  reducers: {
    setHoveredGroupId: (state, action: PayloadAction<string | null>) => {
      const { grouping } = state;

      const fragmentId = action.payload;

      if (!fragmentId) {
        state.hoveredGroupId = null;
        return;
      }

      state.hoveredGroupId = getGroupByElement(grouping, fragmentId);
    },

    setActiveGroupId: (state, action: PayloadAction<string>) => {
      const { grouping, activeGroupsIds } = state;

      const fragmentId = action.payload;

      const groupId = getGroupByElement(grouping, fragmentId);

      if (!groupId) return;

      const isMultiSelect = activeGroupsIds.length > 1;

      const isSelfSelect = activeGroupsIds[0] !== groupId;

      state.activeGroupsIds = isMultiSelect || isSelfSelect ? [groupId] : [];
    },

    toggleActiveGroupId: (state, action: PayloadAction<string>) => {
      const { grouping, activeGroupsIds } = state;

      const fragmentId = action.payload;

      const groupId = getGroupByElement(grouping, fragmentId);

      if (!groupId) return;

      state.activeGroupsIds = toggleArrayElement(activeGroupsIds, groupId);
    },

    createGrouping: (state, action: PayloadAction<string[]>) => {
      const fragmentIds = action.payload;
      state.grouping = createGrouping(fragmentIds);
    },

    uniteActiveGroups: (state) => {
      const { activeGroupsIds, grouping, neighborsGraph } = state;

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

    breakActiveGroup: (state) => {
      const { activeGroupsIds, grouping, neighborsGraph } = state;

      const isSingleSelect = activeGroupsIds.length === 1;

      if (!isSingleSelect) return;

      const activeGroupId = activeGroupsIds[0];

      state.grouping = breakGroup(grouping, activeGroupId);

      state.neighborsGraph = removeGraphNodes(neighborsGraph, [activeGroupId]);
    },

    setNeighborsGraph: (state, action: PayloadAction<UndirectedGraph>) => {
      state.neighborsGraph = action.payload;
    },

    toggleNeighbor: (state, action: PayloadAction<string>) => {
      const { activeGroupsIds, grouping, neighborsGraph } = state;

      const isSingleSelect = activeGroupsIds.length === 1;

      if (!isSingleSelect) return;

      const fragmentId = action.payload;

      const groupId = getGroupByElement(grouping, fragmentId);

      if (!groupId) return;

      const activeGroupId = activeGroupsIds[0];

      const edge: [string, string] = [groupId, activeGroupId];

      state.neighborsGraph = toggleGraphEdge(neighborsGraph, edge);
    },
  },
});

type Actions = Record<string, (...args: any[]) => any>;

export function useActions<T extends Actions>(actions: T): T {
  const dispatch = useDispatch();

  return useMemo(
    () =>
      Object.entries(actions).reduce((acc, [key, action]) => {
        const newAction = (...args: any[]) => dispatch(action(...args));
        acc[key as keyof T] = newAction as any;
        return acc;
      }, {} as T),
    [dispatch]
  );
}

export const { actions, reducer } = levelConstructorSlice;
