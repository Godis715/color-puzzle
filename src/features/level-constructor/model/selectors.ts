import { createSelector } from 'reselect';
import { getGraphColoring } from 'shared/lib/graph-coloring-solver';

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
        isActiveNeighbor: neighborGroups.includes(groupId),
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

export const selectGraphColoringRaw = createSelector(
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

const colors = [
  '#ff99cc',
  '#ccff99',
  '#99ccff',
  '#ffcc99',
  '#cc99ff',
  '#99ffcc',
  '#ffffcc',
  '#ffcccc',
  '#ccccff',
  '#ccffff',
  '#ccffcc',
  '#ffccff',
];

export const selectGraphColoring = createSelector(
  selectGraphColoringRaw,
  (coloring) =>
    Object.fromEntries(
      Object.entries(coloring).map(([gorupId, color]) => [
        gorupId,
        colors[color],
      ])
    )
);

export const selectChromaticNumber = createSelector(
  selectGraphColoringRaw,
  (coloring) => Math.max(-1, ...Object.values(coloring)) + 1
);
