export type UndirectedGraph = [string, string][];

export function removeGraphNodes(
  graph: UndirectedGraph,
  ids: string[]
): UndirectedGraph {
  return graph.filter(([id1, id2]) => !ids.includes(id1) && !ids.includes(id2));
}

export function renameGraphNodeIds(
  graph: UndirectedGraph,
  ids: string[],
  newId: string
): UndirectedGraph {
  return graph
    .map(([id1, id2]) => {
      let newId1 = id1;
      let newId2 = id2;
      if (ids.includes(id1)) newId1 = newId;
      if (ids.includes(id2)) newId2 = newId;
      return [newId1, newId2] as [string, string];
    })
    .filter(([id1, id2]) => id1 !== id2);
}

export function toggleGraphEdge(
  graph: UndirectedGraph,
  edge: [string, string]
): UndirectedGraph {
  if (edge[0] === edge[1]) return graph;

  const edgeIndex = graph.findIndex(([id1, id2]) => {
    if (
      (edge[0] === id1 && edge[1] === id2) ||
      (edge[1] === id1 && edge[0] === id2)
    )
      return true;

    return false;
  });

  if (edgeIndex === -1) {
    return [...graph, edge];
  }

  return graph.filter((_, i) => edgeIndex !== i);
}

export function getGraphNodeNeighbors(
  graph: UndirectedGraph,
  ids: string[]
): string[] {
  return graph.reduce((acc, [id1, id2]) => {
    if (ids.includes(id1)) acc.push(id2);
    if (ids.includes(id2)) acc.push(id1);
    return acc;
  }, [] as string[]);
}

export function getAdjacencyList(
  graph: UndirectedGraph
): Record<string, string[]> {
  return graph.reduce(
    (acc, [id1, id2]) => {
      acc[id1] ??= [];
      acc[id2] ??= [];
      acc[id1].push(id2);
      acc[id2].push(id1);

      return acc;
    },
    {} as Record<string, string[]>
  );
}
