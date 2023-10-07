import { createSelector } from 'reselect';

import { getElementsByGroup } from '../lib/grouping';
import { getGraphNodeNeighbors } from '../lib/undirected-graph';
import { LevelConstructorState, modelName } from './store';

export const selectLevelConstructorState = (state: Record<string, unknown>) =>
  state[modelName] as LevelConstructorState;

export const selectHoveredGroupId = createSelector(
  selectLevelConstructorState,
  (state) => state.hoveredGroupId
);

export const selectActiveGroupsIds = createSelector(
  selectLevelConstructorState,
  (state) => state.activeGroupsIds
);

export const selectGrouping = createSelector(
  selectLevelConstructorState,
  (state) => state.grouping
);

export const selectNeighborsGraph = createSelector(
  selectLevelConstructorState,
  (state) => state.neighborsGraph
);

export const selectFragments = createSelector(
  selectLevelConstructorState,
  (state) => state.fragments
);

export const selectHoveredFragmentsIds = createSelector(
  selectGrouping,
  selectHoveredGroupId,
  selectLevelConstructorState,
  (grouping, hoveredGroupId) =>
    hoveredGroupId ? getElementsByGroup(grouping, [hoveredGroupId]) : []
);

export const selectActiveFragmentsIds = createSelector(
  selectGrouping,
  selectActiveGroupsIds,
  (grouping, activeGroupsIds) => getElementsByGroup(grouping, activeGroupsIds)
);

export const selectActiveFragmentNeighborsIds = createSelector(
  selectGrouping,
  selectNeighborsGraph,
  selectActiveGroupsIds,
  (grouping, neighborsGraph, activeGroupsIds) => {
    if (activeGroupsIds.length !== 1) return [];

    const neighborGroups = getGraphNodeNeighbors(
      neighborsGraph,
      activeGroupsIds
    );

    return getElementsByGroup(grouping, neighborGroups);
  }
);
