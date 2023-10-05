import { useEffect, useState } from 'react';
import paper from 'paper';

import './style.css';

const CANVAS_ID = 'paper-canvas';

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
    path.fillColor = new paper.Color('lightgray');
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

  const [hoveredFragmentId, setHoveredFragmentId] = useState<Id | null>(null);

  const [fragmentsConfig, setFragmentsConfig] = useState<
    FragmentConfig[] | null
  >(null);

  const [decorationsConfig, setDecorationsConfig] = useState<string | null>(
    null
  );

  const fitView = (): void => {
    if (group) {
      viewFitBounds(paper.project.view, group.bounds);
    }
  };

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

  useEffect(() => {
    if (!fragmentsLayer) return () => {};

    fragmentsLayer.children.forEach((fragment) => {
      fragment.fillColor = new paper.Color('lightgray');
    });

    let fragment: paper.Item | null = null;

    if (hoveredFragmentId) {
      fragment = fragmentsLayer.getItem({ id: hoveredFragmentId });
      fragment.tweenTo({ fillColor: 'red' }, 80);
    }

    return () => {
      if (fragment) {
        fragment.tweenTo({ fillColor: 'lightgray' }, 80);
      }
    };
  }, [hoveredFragmentId]);

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

    fragmentsLayer.removeChildren();

    fragmentsLayer.addChildren(fragments);

    fragments.forEach((fragment) => {
      fragment
        .on('mouseenter', () => setHoveredFragmentId(fragment.id))
        .on('mouseleave', () => setHoveredFragmentId(null));
    });

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
                onMouseEnter={() => setHoveredFragmentId(fragment.id)}
                onMouseLeave={() => setHoveredFragmentId(null)}
                className={hoveredFragmentId === fragment.id ? 'active' : ''}
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
          <button type="button">Continue</button>
        </div>
      </div>
    </div>
  );
}
