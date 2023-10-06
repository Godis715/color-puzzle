/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import { useCallback, useEffect, useMemo, useState } from 'react';
import paper from 'paper';

import './style.css';

const CANVAS_ID = 'paper-canvas';

const FRAG_DEFAULT_COLOR = new paper.Color('lightgray');

const FRAG_HOVER_COLOR = new paper.Color('red');

const FRAG_SELECTED_COLOR = new paper.Color('blue');

const ADJ_FRAG_SELECTED_COLOR = new paper.Color('lightblue');

function getFileContentAsText(file: File): Promise<string> {
  const reader = new FileReader();

  return new Promise((resolve) => {
    reader.addEventListener('load', (event) => {
      resolve(event.target?.result?.toString() ?? '');
    });

    reader.readAsText(file);
  });
}

function viewFitBounds(view: paper.View, itemBounds: paper.Rectangle): void {
  const viewBounds = view.bounds;

  if (!viewBounds.area || !itemBounds.area) return;

  const scaleRatio = Math.min(
    viewBounds.width / itemBounds.width,
    viewBounds.height / itemBounds.height
  );

  view.translate(viewBounds.center.subtract(itemBounds.center));
  view.scale(scaleRatio);
}

function flattenChildren(item: paper.Item): paper.Item[] {
  const stack = [item];
  const result: paper.Item[] = [];

  while (stack.length > 0) {
    const currItem = stack.pop();

    if (!currItem) break;

    if (currItem.className === 'Layer' || currItem.className === 'Group') {
      stack.push(...currItem.children);
    } else {
      result.push(currItem);
    }
  }

  return result;
}

function isPathLike(item: paper.Item): boolean {
  return item.className === 'Path' || item.className === 'CompoundPath';
}

function importFragments(svg: string): paper.PathItem[] {
  const importedItem = paper.project.importSVG(svg, {
    applyMatrix: true,
    expandShapes: true,
    insert: false,
  });

  const paths = flattenChildren(importedItem).filter(isPathLike);

  paths.forEach((path) => {
    path.fillColor = FRAG_DEFAULT_COLOR;
    path.strokeWidth = 1;
    path.strokeColor = null;
  });

  return paths as paper.PathItem[];
}

type FragmentConfig = {
  id: string;
  data: string;
};

function createFragmentsConfig(
  fragments: paper.PathItem[] | null
): FragmentConfig[] | null {
  return (
    fragments?.map((fragment) => ({
      id: fragment.id.toString(),
      data: JSON.parse(fragment.exportJSON({ asString: true }) as string),
    })) ?? null
  );
}

function paperForceRedraw(): void {
  const canvas = document.getElementById(CANVAS_ID);

  if (!canvas) return;

  const w = canvas.style.width;

  const rect = canvas.getBoundingClientRect();

  canvas.style.width = `${rect.width - 1}px`;

  window.dispatchEvent(new Event('resize'));

  canvas.style.width = w;

  window.dispatchEvent(new Event('resize'));
}

type UndirectedGraph = [string, string][];

type Grouping = [string, string][];

function removeIds(graph: UndirectedGraph, ids: string[]): UndirectedGraph {
  return graph.filter(([id1, id2]) => !ids.includes(id1) && !ids.includes(id2));
}

function renameGraphNodeIds(
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

function toggleGraphEdge(
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

function getGraphNodeNeighbors(
  graph: UndirectedGraph,
  ids: string[]
): string[] {
  return graph.reduce((acc, [id1, id2]) => {
    if (ids.includes(id1)) acc.push(id2);
    if (ids.includes(id2)) acc.push(id1);
    return acc;
  }, [] as string[]);
}

function generateGroupName() {
  return Math.random().toString();
}

function uniteGroups(
  grouping: Grouping,
  groups: string[],
  newGroupName: string
): [string, string][] {
  return grouping.map(([id, group]) =>
    groups.includes(group) ? [id, newGroupName] : [id, group]
  );
}

function breakGroup(grouping: Grouping, group: string): [string, string][] {
  return grouping.map(([id, g]) => (g === group ? [id, id] : [id, g]));
}

function getElementsByGroup(grouping: Grouping, groups: string[]): string[] {
  return grouping
    .filter(([, group]) => groups.includes(group))
    .map(([id]) => id);
}

function getGroupByElement(grouping: Grouping, id: string): string | null {
  return grouping.find(([elemId]) => elemId === id)?.[1] ?? null;
}

function createGrouping(ids: string[]): Grouping {
  return ids.map((id) => [id, id]);
}

export function LevelConstructorPage(): JSX.Element {
  const [fragmentsLayer, setFragmentsLayer] = useState<paper.Layer>();
  const [decorationsLayer, setDecorationsLayer] = useState<paper.Layer>();
  const [group, setGroup] = useState<paper.Layer>();

  const [hoveredGroupId, setHoveredGroupId] = useState<string | null>(null);
  const [activeGroupsId, setActiveGroupsId] = useState<string[]>([]);
  const [grouping, setGrouping] = useState<Grouping | null>(null);
  const [neighborsGraph, setNeighborsGraph] = useState<UndirectedGraph | null>(
    null
  );

  console.log(grouping);

  const [fragmentsConfig, setFragmentsConfig] = useState<
    FragmentConfig[] | null
  >(null);

  const [decorationsConfig, setDecorationsConfig] = useState<string | null>(
    null
  );

  const getIsFragmentHovered = useMemo(() => {
    if (!grouping || !hoveredGroupId) return () => false;

    const hoveredFragments = getElementsByGroup(grouping, [hoveredGroupId]);

    return (id: string) => hoveredFragments.includes(id.toString());
  }, [hoveredGroupId, grouping]);

  const getIsFragmentActive = useMemo(() => {
    if (!grouping) return () => false;

    const activeFragments = getElementsByGroup(grouping, activeGroupsId);

    return (id: string) => activeFragments.includes(id.toString());
  }, [activeGroupsId, grouping]);

  const getIsFragmentNeighbor = useMemo(() => {
    if (!neighborsGraph || !grouping || activeGroupsId.length !== 1)
      return () => false;

    const activeGroupId = activeGroupsId[0];

    const neighbors = getGraphNodeNeighbors(neighborsGraph, [activeGroupId]);

    const neighborFragments = getElementsByGroup(grouping, neighbors);

    return (id: string) => neighborFragments?.includes(id.toString()) ?? false;
  }, [neighborsGraph, grouping, activeGroupsId]);

  const createFragmentHoverHandler = useCallback(
    (id: string | null) => () => {
      if (!id) {
        setHoveredGroupId(null);
        return;
      }

      if (!grouping) return;

      const groupId = getGroupByElement(grouping, id);

      setHoveredGroupId(groupId);
    },
    [grouping]
  );

  const createFragmentClickHandler = useCallback(
    (fid: string | null) => (event: any) => {
      if (event?.event?.button === 2 && activeGroupsId.length === 1) {
        if (!neighborsGraph || !fid || !grouping) return;

        const activeGroupId = activeGroupsId[0];

        const groupId = getGroupByElement(grouping, fid);

        if (!groupId) return;

        setNeighborsGraph(
          toggleGraphEdge(neighborsGraph, [groupId, activeGroupId])
        );

        return;
      }

      if (!fid) {
        setActiveGroupsId([]);
        return;
      }

      if (!grouping) return;

      const groupId = getGroupByElement(grouping, fid);

      if (!groupId) return;

      const isCtrl = event?.ctrlKey ?? event?.modifiers?.control ?? false;

      if (!isCtrl) {
        if (activeGroupsId.length > 1 || activeGroupsId[0] !== groupId) {
          setActiveGroupsId([groupId]);
        } else {
          setActiveGroupsId([]);
        }
        return;
      }

      if (activeGroupsId.includes(groupId)) {
        setActiveGroupsId(activeGroupsId.filter((gid) => gid !== groupId));
      } else {
        setActiveGroupsId([...activeGroupsId, groupId]);
      }
    },
    [activeGroupsId, grouping, neighborsGraph]
  );

  const fitView = (): void => {
    if (group) {
      viewFitBounds(paper.project.view, group.bounds);
    }
  };

  // Paper setup
  useEffect(() => {
    paper.setup(CANVAS_ID);

    const g = new paper.Layer();

    setGroup(g);

    const fragLayer = new paper.Layer().addTo(g);

    setFragmentsLayer(fragLayer);

    const decLayer = new paper.Layer().addTo(g);

    decLayer.locked = true;

    setDecorationsLayer(decLayer);

    paper.project.view.on('mouseleave', () => setHoveredGroupId(null));

    return () => paper.project.clear();
  }, []);

  useEffect(() => {
    paper.view.onResize = fitView;
  }, [group]);

  // Coloring fragments on hover
  useEffect(() => {
    if (!fragmentsLayer) return;

    fragmentsLayer.children.forEach((fragment) => {
      const fragmentId = fragment.id.toString();

      const getColor = () => {
        const color = getIsFragmentActive(fragmentId)
          ? new paper.Color(FRAG_SELECTED_COLOR)
          : new paper.Color(FRAG_DEFAULT_COLOR);

        if (getIsFragmentHovered(fragmentId)) {
          color.red -= 0.1;
          color.green -= 0.1;
          color.blue -= 0.1;
        }

        if (getIsFragmentNeighbor(fragmentId)) {
          color.red -= 0.2;
          color.blue -= 0.2;
        }

        return color;
      };

      fragment.tweenTo({ fillColor: getColor() }, 80);
    });
  }, [getIsFragmentHovered, getIsFragmentActive, getIsFragmentNeighbor]);

  useEffect(() => {
    fragmentsLayer?.children.forEach((fragment) => {
      const fragmentId = fragment.id.toString();
      fragment.onMouseEnter = createFragmentHoverHandler(fragmentId);
      fragment.onMouseLeave = createFragmentHoverHandler(null);
    });
  }, [fragmentsLayer, createFragmentHoverHandler]);

  useEffect(() => {
    fragmentsLayer?.children.forEach((fragment) => {
      const fragmentId = fragment.id.toString();
      fragment.onClick = createFragmentClickHandler(fragmentId);
    });
  }, [fragmentsLayer, createFragmentClickHandler]);

  const handleUploadFragmentsChange = async (
    ev: React.ChangeEvent<HTMLInputElement>
  ): Promise<void> => {
    if (!fragmentsLayer) return;

    const file = ev.target.files?.item(0) ?? null;

    if (!file) return;

    const svgText = await getFileContentAsText(file);

    if (!svgText) return;

    const fragments = importFragments(svgText);

    setFragmentsConfig(createFragmentsConfig(fragments));

    fragmentsLayer.addChildren(fragments);

    setGrouping(createGrouping(fragments.map(({ id }) => id.toString())));

    setNeighborsGraph([]);

    paperForceRedraw();

    fitView();
  };

  const handleUploadFragmentsClick = (
    ev: React.MouseEvent<HTMLInputElement, MouseEvent>
  ) => {
    if (!fragmentsConfig) return;

    const isConfirmed = confirm(
      'If you upload new fragment file, current fragments will be deleted. Continue?'
    );

    if (!isConfirmed) {
      ev.stopPropagation();
      ev.preventDefault();
    }
  };

  const handleUploadDecorationFile = async (
    ev: React.ChangeEvent<HTMLInputElement>
  ): Promise<void> => {
    const file = ev.target.files?.item(0) ?? null;

    if (!file) return;

    const svgText = await getFileContentAsText(file);

    if (!decorationsLayer) return;

    decorationsLayer.removeChildren();

    if (!svgText) return;

    decorationsLayer.importSVG(svgText);

    // Paper adds rectangle, that represents canvas, as first child, when importing svg
    decorationsLayer.children.at(0)?.children.at(0)?.remove();

    setDecorationsConfig(
      decorationsLayer.exportSVG({ asString: true }) as string
    );

    paperForceRedraw();

    fitView();
  };

  const handleUnite = (): void => {
    if (!grouping || activeGroupsId.length < 2) return;

    const newGroupId = generateGroupName();

    setGrouping(uniteGroups(grouping, activeGroupsId, newGroupId));

    setActiveGroupsId([newGroupId]);

    if (!neighborsGraph) return;

    setNeighborsGraph(
      renameGraphNodeIds(neighborsGraph, activeGroupsId, newGroupId)
    );
  };

  const handleBreak = (): void => {
    if (!grouping || activeGroupsId.length !== 1 || !neighborsGraph) return;

    setGrouping(breakGroup(grouping, activeGroupsId[0]));

    setNeighborsGraph(removeIds(neighborsGraph, activeGroupsId));
  };

  return (
    <div>
      <h2>Level Constructor</h2>

      <div className="workspace">
        <div className="canvas-container">
          <canvas data-paper-resize="true" id={CANVAS_ID} />
        </div>

        <div>
          <ul>
            {fragmentsConfig?.map((fragment) => (
              <li
                key={fragment.id}
                onMouseEnter={createFragmentHoverHandler(fragment.id)}
                onMouseLeave={createFragmentHoverHandler(null)}
                onClick={createFragmentClickHandler(fragment.id)}
                className={getIsFragmentHovered(fragment.id) ? 'active' : ''}
              >
                {fragment.id}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div>
        <div>
          <label htmlFor="upload-fragments">Upload fragments</label>
          <input
            id="upload-fragments"
            type="file"
            onClick={handleUploadFragmentsClick}
            onChange={handleUploadFragmentsChange}
          />
        </div>

        <div>
          <label htmlFor="upload-decorations">Upload decorations</label>
          <input
            id="upload-decorations"
            type="file"
            onChange={handleUploadDecorationFile}
          />
        </div>

        <div>
          <button
            type="button"
            onClick={() => {
              if (fragmentsLayer)
                fragmentsLayer.visible = !fragmentsLayer.visible;
            }}
          >
            Toggle fragments
          </button>
        </div>

        <div>
          <button type="button" onClick={handleUnite}>
            Unite
          </button>
        </div>

        <div>
          <button type="button" onClick={handleBreak}>
            Break
          </button>
        </div>

        <div>
          <button type="button">Continue</button>
        </div>
      </div>
    </div>
  );
}
