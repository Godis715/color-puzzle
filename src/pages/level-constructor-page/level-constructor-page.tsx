/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import { useEffect, useState } from 'react';
import SVG from 'react-inlinesvg';
import paper from 'paper';

import './style.scss';
import { useSelector } from 'react-redux';
import {
  Fragment,
  actions,
  selectFragments,
  selectDecorations,
  selectGroups,
  selectIsActiveGroupReady,
  selectIsSingleSelection,
} from 'features/level-constructor';
import { useActions } from 'shared/hooks';
import {
  selectChromaticNumber,
  selectGraphColoring,
} from 'features/level-constructor/model';
import { FRAG_DEFAULT_COLOR, getFragmentColor } from './get-fragment-color';

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
  const g = new paper.Group();

  const importedItem = paper.project.importSVG(svg, {
    applyMatrix: true,
    expandShapes: true,
    insert: false,
  });

  const paths = flattenChildren(importedItem)
    .filter(isPathLike)
    .reverse()
    .map((p) => p.addTo(g));

  g.fitBounds(new paper.Rectangle(0, 0, 100, 100));

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
    data: path.pathData,
  };
}

function svgToDecorations(svg: string): paper.Item {
  return paper.project.importSVG(svg, {
    applyMatrix: true,
    expandShapes: true,
    insert: false,
  });
}

function decorationsToSvg(item: paper.Item): string {
  const g = new paper.Group();
  item.addTo(g);

  g.fitBounds(new paper.Rectangle(0, 0, 100, 100));

  return item.exportSVG({ asString: true }) as string;
}

function parseSvg(svg: string): any {
  const g = new paper.Group();
  const fragmentsGroup = new paper.Group().addTo(g);
  const decorationsGroups = new paper.Group().addTo(g);

  const svgRoot = paper.project.importSVG(svg, {
    applyMatrix: true,
    expandShapes: true,
    insert: false,
  });

  const [fragments, decorations] = svgRoot.children.slice(1);

  console.log(svgRoot, fragments, decorations);

  const paths = flattenChildren(fragments)
    .filter(isPathLike)
    .reverse()
    .map((p) => p.addTo(fragmentsGroup)) as paper.PathItem[];

  decorations.addTo(decorationsGroups);

  g.fitBounds(new paper.Rectangle(0, 0, 100, 100));

  return {
    fragments: paths.map((path) => ({
      id: path.name,
      data: path.pathData,
    })),
    decorations: decorations.exportSVG({ asString: true }),
  };
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
    toggleIsActiveGroupReady,
    reset: resetState,
  } = useActions(actions);

  const [shouldShowColoring, setShouldShowColoring] = useState(false);

  const fragments = useSelector(selectFragments);
  const decorations = useSelector(selectDecorations);
  const groups = useSelector(selectGroups);
  const isActiveGroupReady = useSelector(selectIsActiveGroupReady);
  const isSingleSelection = useSelector(selectIsSingleSelection);
  const chromaticNumber = useSelector(selectChromaticNumber);
  const coloring = useSelector(selectGraphColoring);

  useEffect(() => {
    paper.setup(CANVAS_ID);
  }, []);

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

  const hasActive = groups.some(({ isActive }) => isActive);

  const handleUploadFragmentsChange = async (
    ev: React.ChangeEvent<HTMLInputElement>
  ): Promise<void> => {
    const file = ev.target.files?.item(0) ?? null;

    if (!file) return;

    const svgText = await getFileContentAsText(file);

    if (!svgText) return;

    const res = parseSvg(svgText);

    setFragments(res.fragments);
    setDecorations(res.decorations);
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

  const handleUnite = (): void => {
    uniteActive();
  };

  const handleBreak = (): void => {
    breakActive();
  };

  return (
    <div>
      <h2>Level Constructor</h2>

      <canvas id={CANVAS_ID} style={{ display: 'none' }} />

      <div className="workspace">
        <div className="viewport">
          <svg viewBox="0 0 100 100">
            {groups.map((group) =>
              group.fragmentIds.map((fragmentId) => {
                const fragment = fragments.find(({ id }) => id === fragmentId);

                if (!fragment) return null;

                const { red, green, blue } = shouldShowColoring
                  ? new paper.Color(coloring[group.id])
                  : getFragmentColor({
                      isActive: group.isActive,
                      isHovered: group.isHovered,
                      isActiveNeighbor: group.isActiveNeighbor,
                      isReady: group.isReady,
                      hasActive,
                    });

                return (
                  <path
                    d={fragment.data}
                    key={group.id}
                    fill={`rgb(${256 * red},${256 * green},${256 * blue})`}
                    onMouseEnter={createGroupHoverHandler(group.id)}
                    onMouseLeave={createGroupHoverHandler(null)}
                    onClick={createGroupClickHandler(group.id)}
                  />
                );
              })
            )}
          </svg>

          {decorations && (
            /** @ts-ignore */
            <SVG
              src={`<svg>${decorations}</svg>`}
              style={{ pointerEvents: 'none' }}
              viewBox="0 0 100 100"
            />
          )}
        </div>

        <div>
          <div>Chromatic number: {chromaticNumber}</div>
          <div>Groups: {groups.length}</div>

          <div>
            <div>
              <input
                id="show-coloring-checkbox"
                type="checkbox"
                checked={shouldShowColoring}
                onChange={(ev) => setShouldShowColoring(ev.target.checked)}
              />
              <label htmlFor="show-coloring-checkbox">Show coloring</label>
            </div>

            <div>
              <button type="button" onClick={handleUnite}>
                Unite
              </button>

              <button type="button" onClick={handleBreak}>
                Break
              </button>
            </div>
          </div>

          <div>
            <button
              type="button"
              style={{ marginTop: '3em' }}
              disabled={!isSingleSelection}
              onClick={() => {
                toggleIsActiveGroupReady();

                if (!isActiveGroupReady) {
                  setActiveGroupId(null);
                }
              }}
            >
              {isActiveGroupReady ? 'Mark as NOT ready' : 'Mark as ready'}
            </button>
          </div>

          <div style={{ marginTop: '5em' }}>
            <div>
              <label htmlFor="upload-fragments">Upload fragments</label>
              <input
                id="upload-fragments"
                type="file"
                onClick={handleUploadFragmentsClick}
                onChange={handleUploadFragmentsChange}
              />
            </div>
          </div>

          <div>
            <button
              type="button"
              onClick={() => {
                const isConfirmed = confirm(
                  'Current progress will be deleted. Continue?'
                );

                if (isConfirmed) {
                  resetState();
                }
              }}
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
