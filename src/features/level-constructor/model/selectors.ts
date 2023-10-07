import { createSelector } from 'reselect';

import { getElementsByGroup } from '../lib/grouping';
import {
  getAdjacencyList,
  getGraphNodeNeighbors,
} from '../lib/undirected-graph';
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

export const selectDecorations = createSelector(
  selectLevelConstructorState,
  (state) => state.decorations
);

export const selectReadyGroups = createSelector(
  selectLevelConstructorState,
  (state) => state.readyGroups
);

export const selectIsActiveGroupReady = createSelector(
  selectActiveGroupsIds,
  selectReadyGroups,
  (activeGroupsIds, readyGroups) => {
    const isSingleSelect = activeGroupsIds.length === 1;

    if (!isSingleSelect) return false;

    const groupId = activeGroupsIds[0];

    return readyGroups.includes(groupId);
  }
);

export const selectGroups = createSelector(
  selectGrouping,
  selectActiveGroupsIds,
  selectHoveredGroupId,
  selectNeighborsGraph,
  selectReadyGroups,
  (grouping, activeGroupsIds, hoveredGroupId, neighborsGraph, readyGroups) => {
    const mapGroupIdToFragmentsIds = grouping.reduce(
      (acc, [fragmentId, groupId]) => {
        acc[groupId] ??= [];
        acc[groupId].push(fragmentId);
        return acc;
      },
      {} as Record<string, string[]>
    );

    const mapGroupIdToNeighborsIds = getAdjacencyList(neighborsGraph);

    return Object.entries(mapGroupIdToFragmentsIds).map(
      ([groupId, fragmentIds]) => ({
        id: groupId,
        fragmentIds,
        isActive: activeGroupsIds.includes(groupId),
        isHovered: hoveredGroupId === groupId,
        neighbors: mapGroupIdToNeighborsIds[groupId] ?? [],
        isReady: readyGroups.includes(groupId),
      })
    );
  }
);

export const selectFragmentIdToGroupIdMapping = createSelector(
  selectGrouping,
  (grouping) => Object.fromEntries(grouping)
);

export const selectIsSingleSelection = createSelector(
  selectActiveGroupsIds,
  (activeGroupsIds) => activeGroupsIds.length === 1
);
