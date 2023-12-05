import { createSelector } from 'reselect';

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

    const neighborGroups = getGraphNodeNeighbors(
      neighborsGraph,
      activeGroupsIds
    );

    return Object.entries(mapGroupIdToFragmentsIds).map(
      ([groupId, fragmentIds]) => ({
        id: groupId,
        fragmentIds,
        isActive: activeGroupsIds.includes(groupId),
        isHovered: hoveredGroupId === groupId,
        neighbors: mapGroupIdToNeighborsIds[groupId] ?? [],
        isReady: readyGroups.includes(groupId),
        isActiveNeighbor:
          neighborGroups.includes(groupId) &&
          !activeGroupsIds.includes(groupId),
      })
    );
  }
);

export const selectMapFragmentIdToGroupId = createSelector(
  selectGrouping,
  (grouping) => Object.fromEntries(grouping)
);

export const selectIsSingleSelection = createSelector(
  selectActiveGroupsIds,
  (activeGroupsIds) => activeGroupsIds.length === 1
);

export const selectIsMultiSelection = createSelector(
  selectActiveGroupsIds,
  (activeGroupsIds) => activeGroupsIds.length > 1
);

export const selectHasSelection = createSelector(
  selectActiveGroupsIds,
  (activeGroupsIds) => activeGroupsIds.length > 0
);

export const selectLevelDto = createSelector(
  selectLevelConstructorState,
  (state) => ({
    grouping: state.grouping,
    neighborsGraph: state.neighborsGraph,
    fragments: state.fragments,
    decorations: state.decorations,
    readyGroups: state.readyGroups,
  })
);
