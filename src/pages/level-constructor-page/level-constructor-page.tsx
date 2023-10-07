/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import { useCallback, useEffect, useState } from 'react';
import paper from 'paper';

import './style.css';
import { useSelector } from 'react-redux';
import {
  Fragment,
  actions,
  selectActiveFragmentNeighborsIds,
  selectActiveFragmentsIds,
  selectFragments,
  selectHoveredFragmentsIds,
  selectDecorations,
  selectGroups,
  selectFragmentIdToGroupIdMapping,
} from 'features/level-constructor';
import { useActions } from 'shared/hooks';

const CANVAS_ID = 'paper-canvas';

const FRAG_DEFAULT_COLOR = new paper.Color('#ECECEC');

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

function importPathsFromSvg(svg: string): paper.PathItem[] {
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

function pathToFragment(path: paper.PathItem): Fragment {
  return {
    id: path.name,
    data: path.exportJSON({ asString: false }),
  };
}

function fragmentToPath(fragment: Fragment): paper.PathItem {
  const path = new paper.Path();

  path.importJSON(fragment.data);

  return path;
}

function svgToDecorations(svg: string): paper.Item {
  return paper.project.importSVG(svg, {
    applyMatrix: true,
    expandShapes: true,
    insert: false,
  });
}

function decorationsToSvg(item: paper.Item): string {
  return item.exportSVG({ asString: true }) as string;
}

function paperForceRedraw(): void {
  setTimeout(() => {
    const canvas = document.getElementById(CANVAS_ID);

    if (!canvas) return;

    const w = canvas.style.width;

    const rect = canvas.getBoundingClientRect();

    canvas.style.width = `${rect.width - 0.001}px`;

    window.dispatchEvent(new Event('resize'));

    canvas.style.width = w;

    window.dispatchEvent(new Event('resize'));
  }, 1);
}

function gerFragmentColor({
  isActive,
  isHovered,
  isActiveNeighbor,
}: {
  isActive: boolean;
  isHovered: boolean;
  isActiveNeighbor: boolean;
}): paper.Color {
  const color = new paper.Color(FRAG_DEFAULT_COLOR);

  if (isActive) {
    color.red -= 0.3;
    color.green -= 0.2;
  }

  if (isHovered) {
    color.red -= 0.07;
    color.green -= 0.07;
    color.blue -= 0.03;
  }

  if (isActiveNeighbor) {
    color.red -= 0.1;
    color.blue -= 0.1;
  }

  return color;
}

export function LevelConstructorPage(): JSX.Element {
  const {
    setActiveGroupId,
    toggleActiveGroupId,
    uniteActive,
    breakActive,
    toggleNeighbor,
    setFragments,
    setDecorations,
    setHoveredGroupId,
  } = useActions(actions);

  const [fragmentsLayer, setFragmentsLayer] = useState<paper.Layer>();
  const [decorationsLayer, setDecorationsLayer] = useState<paper.Layer>();
  const [rootLayer, setRootLayer] = useState<paper.Layer>();

  const hoveredFragmentsIds = useSelector(selectHoveredFragmentsIds);
  const activeFragmentsIds = useSelector(selectActiveFragmentsIds);
  const activeFragmentNeighbors = useSelector(selectActiveFragmentNeighborsIds);
  const fragments = useSelector(selectFragments);
  const decorations = useSelector(selectDecorations);
  const groups = useSelector(selectGroups);
  const mapFragmentIdToGroupId = useSelector(selectFragmentIdToGroupIdMapping);

  const createGroupHoverHandler = (hoveredGroupId: string | null) => () =>
    setHoveredGroupId(hoveredGroupId);

  const createGroupClickHandler = (clickedGroupId: string) => (event: any) => {
    const isRightButton = event?.event?.button === 2;
    const isCtrl = event?.ctrlKey ?? event?.modifiers?.control ?? false;

    if (isRightButton) {
      toggleNeighbor(clickedGroupId);
    } else if (isCtrl) {
      toggleActiveGroupId(clickedGroupId);
    } else {
      setActiveGroupId(clickedGroupId);
    }
  };

  const fitView = useCallback((): void => {
    if (rootLayer) {
      viewFitBounds(paper.project.view, rootLayer.bounds);
    }
  }, [rootLayer]);

  // Paper setup
  useEffect(() => {
    paper.setup(CANVAS_ID);

    const g = new paper.Layer();

    setRootLayer(g);

    const fragLayer = new paper.Layer().addTo(g);

    setFragmentsLayer(fragLayer);

    const decLayer = new paper.Layer().addTo(g);

    decLayer.locked = true;

    setDecorationsLayer(decLayer);

    paper.project.view.on('mouseleave', () => setHoveredGroupId(null));

    return () => paper.project.clear();
  }, []);

  useEffect(() => {
    if (fragmentsLayer && fragments.length > 0) {
      fragments
        .map(fragmentToPath)
        .forEach((path) => path.addTo(fragmentsLayer));
    }

    if (decorationsLayer && decorations) {
      svgToDecorations(decorations).addTo(decorationsLayer);
    }

    paperForceRedraw();
  }, [fragmentsLayer, decorationsLayer]);

  useEffect(() => {
    paper.view.onResize = fitView;
  }, [fitView]);

  // Coloring fragments on hover
  useEffect(() => {
    if (!fragmentsLayer) return;

    fragmentsLayer.children.forEach((fragment) => {
      const fragmentId = fragment.name;

      const color = gerFragmentColor({
        isActive: activeFragmentsIds.includes(fragmentId),
        isHovered: hoveredFragmentsIds.includes(fragmentId),
        isActiveNeighbor: activeFragmentNeighbors.includes(fragmentId),
      });

      fragment.tweenTo({ fillColor: color }, 60);
    });
  }, [hoveredFragmentsIds, activeFragmentsIds, activeFragmentNeighbors]);

  useEffect(() => {
    fragmentsLayer?.children.forEach((fragment) => {
      const groupId = mapFragmentIdToGroupId[fragment.name];

      if (!groupId) return;

      fragment.onMouseEnter = createGroupHoverHandler(groupId);
      fragment.onMouseLeave = createGroupHoverHandler(null);
      fragment.onClick = createGroupClickHandler(groupId);
    });
  }, [fragmentsLayer, fragments, mapFragmentIdToGroupId]);

  const handleUploadFragmentsChange = async (
    ev: React.ChangeEvent<HTMLInputElement>
  ): Promise<void> => {
    if (!fragmentsLayer) return;

    const file = ev.target.files?.item(0) ?? null;

    if (!file) return;

    const svgText = await getFileContentAsText(file);

    if (!svgText) return;

    const fragmentsPaths = importPathsFromSvg(svgText);

    setFragments(fragmentsPaths.map(pathToFragment));

    fragmentsLayer.addChildren(fragmentsPaths);

    paperForceRedraw();

    fitView();
  };

  const handleUploadFragmentsClick = (
    ev: React.MouseEvent<HTMLInputElement, MouseEvent>
  ) => {
    if (!fragments.length) return;

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

    const decorationsItem = svgToDecorations(svgText).addTo(decorationsLayer);

    // Paper adds rectangle, that represents canvas, as first child, when importing svg
    decorationsLayer.children.at(0)?.children.at(0)?.remove();

    setDecorations(decorationsToSvg(decorationsItem));

    paperForceRedraw();

    fitView();
  };

  const handleUnite = (): void => {
    uniteActive();
  };

  const handleBreak = (): void => {
    breakActive();
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
            {groups.map((group) => (
              <li
                key={group.id}
                onMouseEnter={createGroupHoverHandler(group.id)}
                onMouseLeave={createGroupHoverHandler(null)}
                onClick={createGroupClickHandler(group.id)}
                className={group.isActive ? 'active' : ''}
              >
                {group.id} ({group.neighbors.length})
                {group.fragmentIds.length > 1 && ' (multi)'}
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
