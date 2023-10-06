/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import { useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import paper from 'paper';

import './style.css';
import { useDispatch, useSelector } from 'react-redux';
import { actions, selectHoveredGroupId } from 'features/level-constructor';
import {
  UndirectedGraph,
  getGraphNodeNeighbors,
  toggleGraphEdge,
  renameGraphNodeIds,
  removeGraphNodes,
} from './undirected-graph';
import {
  Grouping,
  getElementsByGroup,
  getGroupByElement,
  createGrouping,
  generateGroupName,
  uniteGroups,
  breakGroup,
} from './grouping';

const CANVAS_ID = 'paper-canvas';

const FRAG_DEFAULT_COLOR = new paper.Color('lightgray');

const FRAG_SELECTED_COLOR = new paper.Color('blue');

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

function toggleArrayElement<T>(array: T[], element: T): T[] {
  return array.includes(element)
    ? array.filter((elem) => elem !== element)
    : array.concat(element);
}

export function LevelConstructorPage(): JSX.Element {
  const dispatch = useDispatch();

  const [fragmentsLayer, setFragmentsLayer] = useState<paper.Layer>();
  const [decorationsLayer, setDecorationsLayer] = useState<paper.Layer>();
  const [group, setGroup] = useState<paper.Layer>();

  const [activeGroupsIds, setActiveGroupsId] = useState<string[]>([]);
  const [grouping, setGrouping] = useState<Grouping>([]);
  const [neighborsGraph, setNeighborsGraph] = useState<UndirectedGraph>([]);

  const [fragmentsConfig, setFragmentsConfig] = useState<
    FragmentConfig[] | null
  >(null);

  const [decorationsConfig, setDecorationsConfig] = useState<string | null>(
    null
  );

  const hoveredGroupId = useSelector(selectHoveredGroupId);

  const hoveredFragments = useMemo(
    () =>
      hoveredGroupId ? getElementsByGroup(grouping, [hoveredGroupId]) : [],
    [hoveredGroupId, grouping]
  );

  const activeFragments = useMemo(
    () => getElementsByGroup(grouping, activeGroupsIds),
    [activeGroupsIds, grouping]
  );

  const activeFragmentNeighbors = useMemo(() => {
    if (activeGroupsIds.length !== 1) return [];

    const neighborGroups = getGraphNodeNeighbors(
      neighborsGraph,
      activeGroupsIds
    );

    return getElementsByGroup(grouping, neighborGroups);
  }, [neighborsGraph, grouping, activeGroupsIds]);

  const createFragmentHoverHandler = useCallback(
    (hoveredFragmentId: string | null) => () => {
      if (!hoveredFragmentId) {
        dispatch(actions.setHoveredGroupId(null));
        return;
      }

      dispatch(
        actions.setHoveredGroupId(
          getGroupByElement(grouping, hoveredFragmentId)
        )
      );
    },
    [grouping]
  );

  const createFragmentClickHandler = useCallback(
    (clickedFragmentId: string) => (event: any) => {
      const clickedGroupId = getGroupByElement(grouping, clickedFragmentId);

      if (!clickedGroupId) return;

      const isRightButton = event?.event?.button === 2;

      if (isRightButton && activeGroupsIds.length === 1) {
        const activeGroupId = activeGroupsIds[0];

        setNeighborsGraph(
          toggleGraphEdge(neighborsGraph, [clickedGroupId, activeGroupId])
        );
      } else {
        const isCtrl = event?.ctrlKey ?? event?.modifiers?.control ?? false;

        if (isCtrl) {
          setActiveGroupsId(
            toggleArrayElement(activeGroupsIds, clickedGroupId)
          );
        } else if (
          activeGroupsIds.length > 1 ||
          activeGroupsIds[0] !== clickedGroupId
        ) {
          setActiveGroupsId([clickedGroupId]);
        } else {
          setActiveGroupsId([]);
        }
      }
    },
    [activeGroupsIds, grouping, neighborsGraph]
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

    paper.project.view.on('mouseleave', () =>
      dispatch(actions.setHoveredGroupId(null))
    );

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
        const color = activeFragments.includes(fragmentId)
          ? new paper.Color(FRAG_SELECTED_COLOR)
          : new paper.Color(FRAG_DEFAULT_COLOR);

        if (hoveredFragments.includes(fragmentId)) {
          color.red -= 0.1;
          color.green -= 0.1;
          color.blue -= 0.1;
        }

        if (activeFragmentNeighbors.includes(fragmentId)) {
          color.red -= 0.2;
          color.blue -= 0.2;
        }

        return color;
      };

      fragment.tweenTo({ fillColor: getColor() }, 80);
    });
  }, [hoveredFragments, activeFragments, activeFragmentNeighbors]);

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
    if (activeGroupsIds.length < 2) return;

    const newGroupId = generateGroupName();

    setGrouping(uniteGroups(grouping, activeGroupsIds, newGroupId));

    setActiveGroupsId([newGroupId]);

    setNeighborsGraph(
      renameGraphNodeIds(neighborsGraph, activeGroupsIds, newGroupId)
    );
  };

  const handleBreak = (): void => {
    if (activeGroupsIds.length !== 1) return;

    setGrouping(breakGroup(grouping, activeGroupsIds[0]));

    setNeighborsGraph(removeGraphNodes(neighborsGraph, activeGroupsIds));
  };

  return (
    <div>
      <h2>Level Constructor</h2>

      <div className="workspace">
        <div className="canvas-container">
          <canvas
            data-paper-resize="true"
            id={CANVAS_ID}
            onContextMenu={(ev) => ev.preventDefault()}
          />
        </div>

        <div>
          <ul>
            {fragmentsConfig?.map((fragment) => (
              <li
                key={fragment.id}
                onMouseEnter={createFragmentHoverHandler(fragment.id)}
                onMouseLeave={createFragmentHoverHandler(null)}
                onClick={createFragmentClickHandler(fragment.id)}
                className={
                  hoveredFragments.includes(fragment.id) ? 'active' : ''
                }
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
