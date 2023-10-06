/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import { useEffect, useState } from 'react';
import paper from 'paper';

import './style.css';
import { useSelector } from 'react-redux';
import {
  actions,
  selectActiveFragmentNeighborsIds,
  selectActiveFragmentsIds,
  selectFragments,
  selectHoveredFragmentsIds,
} from 'features/level-constructor';
import {
  Fragment,
  useActions,
} from 'features/level-constructor/level-constructor-store';

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

function createFragments(fragments: paper.PathItem[] | null): Fragment[] {
  return (
    fragments?.map((fragment) => ({
      id: fragment.id.toString(),
      data: JSON.parse(fragment.exportJSON({ asString: true }) as string),
    })) ?? []
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

export function LevelConstructorPage(): JSX.Element {
  const {
    setHoveredFragmentId,
    setActiveFragmentId,
    toggleActiveFragmentId,
    uniteActive,
    breakActive,
    toggleNeighbor,
    setFragments,
  } = useActions(actions);

  const [fragmentsLayer, setFragmentsLayer] = useState<paper.Layer>();
  const [decorationsLayer, setDecorationsLayer] = useState<paper.Layer>();
  const [group, setGroup] = useState<paper.Layer>();

  const [decorationsConfig, setDecorationsConfig] = useState<string | null>(
    null
  );

  const hoveredFragmentsIds = useSelector(selectHoveredFragmentsIds);
  const activeFragmentsIds = useSelector(selectActiveFragmentsIds);
  const activeFragmentNeighbors = useSelector(selectActiveFragmentNeighborsIds);
  const fragments = useSelector(selectFragments);

  const createFragmentHoverHandler = (hoveredFragmentId: string | null) => () =>
    setHoveredFragmentId(hoveredFragmentId);

  const createFragmentClickHandler =
    (clickedFragmentId: string) => (event: any) => {
      const isRightButton = event?.event?.button === 2;

      const isCtrl = event?.ctrlKey ?? event?.modifiers?.control ?? false;

      if (isRightButton) {
        toggleNeighbor(clickedFragmentId);
      } else if (isCtrl) {
        toggleActiveFragmentId(clickedFragmentId);
      } else {
        setActiveFragmentId(clickedFragmentId);
      }
    };

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

    paper.project.view.on('mouseleave', () => setHoveredFragmentId(null));

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
        const color = activeFragmentsIds.includes(fragmentId)
          ? new paper.Color(FRAG_SELECTED_COLOR)
          : new paper.Color(FRAG_DEFAULT_COLOR);

        if (hoveredFragmentsIds.includes(fragmentId)) {
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
  }, [hoveredFragmentsIds, activeFragmentsIds, activeFragmentNeighbors]);

  useEffect(() => {
    fragmentsLayer?.children.forEach((fragment) => {
      const fragmentId = fragment.id.toString();
      fragment.onMouseEnter = createFragmentHoverHandler(fragmentId);
      fragment.onMouseLeave = createFragmentHoverHandler(null);
      fragment.onClick = createFragmentClickHandler(fragmentId);
    });
  }, [fragmentsLayer, fragments]);

  const handleUploadFragmentsChange = async (
    ev: React.ChangeEvent<HTMLInputElement>
  ): Promise<void> => {
    if (!fragmentsLayer) return;

    const file = ev.target.files?.item(0) ?? null;

    if (!file) return;

    const svgText = await getFileContentAsText(file);

    if (!svgText) return;

    const fragmentsPaths = importFragments(svgText);

    setFragments(createFragments(fragmentsPaths));

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
            {fragments?.map((fragment) => (
              <li
                key={fragment.id}
                onMouseEnter={createFragmentHoverHandler(fragment.id)}
                onMouseLeave={createFragmentHoverHandler(null)}
                onClick={createFragmentClickHandler(fragment.id)}
                className={
                  hoveredFragmentsIds.includes(fragment.id) ? 'active' : ''
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
