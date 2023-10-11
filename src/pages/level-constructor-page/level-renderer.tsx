import SVG from 'react-inlinesvg';

import { Fragment } from 'src/features/level-constructor';
import { Decorations } from 'src/features/level-constructor/model';

type Props = {
  fragments: Fragment[];
  decorations: Decorations | null;
  getFragmentColor: (id: string) => string;
  onFragmentHover: (id: string | null) => void;
  onFragmentClick: (id: string, ev: React.MouseEvent) => void;
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
    onFragmentContextMenu,
  } = props;

  return (
    <div className="viewport">
      <svg viewBox="0 0 100 100">
        {fragments.map((fragment) => (
          <path
            className="fragment"
            d={fragment.data}
            key={fragment.id}
            fill={getFragmentColor(fragment.id)}
            onMouseEnter={() => onFragmentHover(fragment.id)}
            onMouseLeave={() => onFragmentHover(null)}
            onClick={(event) => onFragmentClick(fragment.id, event)}
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
