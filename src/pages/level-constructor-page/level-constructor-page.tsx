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
  id: string | number;
  data: string;
};

function createFragmentsConfig(
  fragments: paper.PathItem[] | null
): FragmentConfig[] | null {
  return (
    fragments?.map((fragment) => ({
      id: fragment.id,
      data: JSON.parse(fragment.exportJSON({ asString: true }) as string),
    })) ?? null
  );
}

type Id = string | number;

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

export function LevelConstructorPage(): JSX.Element {
  const [fragmentsLayer, setFragmentsLayer] = useState<paper.Layer>();
  const [decorationsLayer, setDecorationsLayer] = useState<paper.Layer>();
  const [group, setGroup] = useState<paper.Layer>();

  const [hoveredGroupId, setHoveredGroupId] = useState<Id | null>(null);
  const [activeGroupsId, setActiveGroupsId] = useState<Id[]>([]);
  const [groups, setGroups] = useState<Record<Id, Id> | null>(null);
  const [neighbors, setNeighbors] = useState<Record<Id, Id[]> | null>(null);

  const [fragmentsConfig, setFragmentsConfig] = useState<
    FragmentConfig[] | null
  >(null);

  const [decorationsConfig, setDecorationsConfig] = useState<string | null>(
    null
  );

  const getIsFragmentHovered = useMemo(() => {
    if (!groups) return () => false;

    const hoveredFragments = Object.entries(groups)
      .filter(([, groupId]) => groupId === hoveredGroupId)
      .map(([fragId]) => fragId);

    return (id: Id) => hoveredFragments.includes(id.toString());
  }, [hoveredGroupId, groups]);

  const getIsFragmentActive = useMemo(() => {
    if (!groups) return () => false;

    const activeFragments = Object.entries(groups)
      .filter(([, groupId]) => activeGroupsId.includes(groupId))
      .map(([fragId]) => fragId);

    return (id: Id) => activeFragments.includes(id.toString());
  }, [activeGroupsId, groups]);

  const getIsFragmentNeighbor = useMemo(() => {
    if (!neighbors || !groups || activeGroupsId.length !== 1)
      return () => false;

    const activeGroupId = activeGroupsId[0];

    const neighborFragments = Object.entries(groups)
      .filter(([, groupId]) => neighbors[activeGroupId].includes(groupId))
      .map(([fragId]) => fragId);

    return (id: Id) => neighborFragments?.includes(id.toString()) ?? false;
  }, [neighbors, groups, activeGroupsId]);

  const createFragmentHoverHandler = useCallback(
    (id: Id | null) => () => {
      if (!id) {
        setHoveredGroupId(null);
        return;
      }

      if (!groups) return;

      const groupId = groups[id];

      setHoveredGroupId(groupId);
    },
    [groups]
  );

  const createFragmentClickHandler = useCallback(
    (id: Id | null) => (event: any) => {
      if (event?.event?.button === 2 && activeGroupsId.length === 1) {
        if (!neighbors || !id) return;

        const groupId = activeGroupsId[0];

        const activeNeighbors = neighbors[groupId];

        if (activeNeighbors.includes(id)) {
          setNeighbors({
            ...neighbors,
            [groupId]: activeNeighbors.filter((nid) => nid !== id),
            [id]: neighbors[id].filter((nid) => nid !== groupId),
          });
        } else {
          setNeighbors({
            ...neighbors,
            [groupId]: [...activeNeighbors, id],
            [id]: [...neighbors[id], groupId],
          });
        }

        return;
      }

      if (!id) {
        setActiveGroupsId([]);
        return;
      }

      if (!groups) return;

      const groupId = groups[id];

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
    [activeGroupsId, groups, neighbors]
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
      const getColor = () => {
        const color = getIsFragmentActive(fragment.id)
          ? new paper.Color(FRAG_SELECTED_COLOR)
          : new paper.Color(FRAG_DEFAULT_COLOR);

        if (getIsFragmentHovered(fragment.id)) {
          color.red -= 0.1;
          color.green -= 0.1;
          color.blue -= 0.1;
        }

        if (getIsFragmentNeighbor(fragment.id)) {
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
      fragment.onMouseEnter = createFragmentHoverHandler(fragment.id);
      fragment.onMouseLeave = createFragmentHoverHandler(null);
    });
  }, [fragmentsLayer, createFragmentHoverHandler]);

  useEffect(() => {
    fragmentsLayer?.children.forEach((fragment) => {
      fragment.onClick = createFragmentClickHandler(fragment.id);
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

    setGroups(
      fragments.reduce(
        (acc, fragment) => {
          acc[fragment.id] = fragment.id;
          return acc;
        },
        {} as Record<Id, Id>
      )
    );

    setNeighbors(
      fragments.reduce(
        (acc, fragment) => {
          acc[fragment.id] = [];
          return acc;
        },
        {} as Record<Id, Id[]>
      )
    );

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
    if (!groups || activeGroupsId.length < 2) return;

    const newGroups = Object.fromEntries(
      Object.entries(groups).map(([fragId, groupId]) => {
        if (!activeGroupsId.includes(groupId)) return [fragId, groupId];

        return [fragId, activeGroupsId[0]];
      })
    );

    setGroups(newGroups);
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
          <button type="button">Continue</button>
        </div>
      </div>
    </div>
  );
}
