import { createSelector } from 'reselect';

import { getGraphColoring } from 'src/shared/lib/graph-coloring-solver';
import { estimateComplexity } from 'src/shared/lib/graph-complexity-estimator';

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

export const selectGraphColoring = createSelector(
  selectGroups,
  selectNeighborsGraph,
  (groups, neighborsGraph) => {
    const groupsIds = groups.map(({ id }) => id);
    const mapGroupIdToIdx = Object.fromEntries(
      groupsIds.map((id, i) => [id, i])
    );

    const encodedGraph = new Array(groupsIds.length)
      .fill(null)
      .map(() => [] as number[]);

    neighborsGraph.forEach(([n1, n2]) => {
      const i1 = mapGroupIdToIdx[n1];
      const i2 = mapGroupIdToIdx[n2];
      encodedGraph[i1].push(i2);
      encodedGraph[i2].push(i1);
    });

    const coloring = getGraphColoring(encodedGraph);

    const mapGroupToColor = Object.fromEntries(
      coloring.map((color, i) => [groupsIds[i], color])
    );

    return mapGroupToColor;
  }
);

export const selectChromaticNumber = createSelector(
  selectGraphColoring,
  (coloring) => Math.max(-1, ...Object.values(coloring)) + 1
);

export const selectGraphComplexity = createSelector(
  selectGroups,
  selectNeighborsGraph,
  selectChromaticNumber,
  (groups, neighborsGraph, chromaticNumber) => {
    const groupsIds = groups.map(({ id }) => id);
    const mapGroupIdToIdx = Object.fromEntries(
      groupsIds.map((id, i) => [id, i])
    );

    const encodedGraph = new Array(groupsIds.length)
      .fill(null)
      .map(() => [] as number[]);

    neighborsGraph.forEach(([n1, n2]) => {
      const i1 = mapGroupIdToIdx[n1];
      const i2 = mapGroupIdToIdx[n2];
      encodedGraph[i1].push(i2);
      encodedGraph[i2].push(i1);
    });

    return estimateComplexity(encodedGraph, chromaticNumber, 10000);
  }
);
