import SVG from 'react-inlinesvg';

import { Fragment } from 'features/level-constructor';
import { Decorations } from 'features/level-constructor/model';

type Props = {
  fragments: Fragment[];
  decorations: Decorations | null;
  getFragmentColor: (id: string) => string;
  onFragmentHover: (id: string | null) => void;
  onFragmentRightClick: (id: string) => void;
  onFragmentClick: (id: string, withCtrl: boolean) => void;
  onFragmentContextMenu: (
    id: string,
    position: { top: number; left: number }
  ) => void;
};

export function LevelRenderer(props: Props): JSX.Element {
  const {
    fragments,
    decorations,
    getFragmentColor,
    onFragmentHover,
    onFragmentClick,
    onFragmentRightClick,
    onFragmentContextMenu,
  } = props;

  return (
    <div className="viewport">
      <svg viewBox="0 0 100 100">
        {fragments.map((fragment) => (
          <path
            d={fragment.data}
            key={fragment.id}
            fill={getFragmentColor(fragment.id)}
            onMouseEnter={() => onFragmentHover(fragment.id)}
            onMouseLeave={() => onFragmentHover(null)}
            onClick={(event) => onFragmentClick(fragment.id, event.ctrlKey)}
            onContextMenu={(ev) => {
              ev.preventDefault();

              onFragmentContextMenu(fragment.id, {
                top: ev.clientY,
                left: ev.clientX,
              });
            }}
          />
        ))}
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
  );
}
