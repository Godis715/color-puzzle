import { cn } from '@bem-react/classname';
import SVG from 'react-inlinesvg';

import { Fragment, Decorations } from 'src/features/level-constructor';

type Props = {
  fragments: Fragment[];
  decorations: Decorations | null;

  getFragmentGroupId: (id: string) => string;
  getGroupColor: (id: string) => string;
  getGroupClassName?: (id: string) => string;

  onGroupHover: (id: string | null) => void;
  onGroupClick: (id: string, ev: React.MouseEvent) => void;
  onGroupContextMenu: (
    id: string,
    position: { top: number; left: number }
  ) => void;
};

const cnFragment = cn('Fragment');

export function LevelRenderer(props: Props): JSX.Element {
  const {
    fragments,
    decorations,
    getFragmentGroupId,
    getGroupColor,
    onGroupHover,
    onGroupClick,
    onGroupContextMenu,
    getGroupClassName,
  } = props;

  return (
    <div className="viewport">
      <svg viewBox="0 0 100 100">
        {fragments.map((fragment) => {
          const groupId = getFragmentGroupId(fragment.id);

          const mixClassName = getGroupClassName?.(groupId);
          const className = cnFragment(null, mixClassName);

          return (
            <path
              key={fragment.id}
              className={className}
              d={fragment.data}
              fill={getGroupColor(groupId)}
              onMouseEnter={() => onGroupHover(groupId)}
              onMouseLeave={() => onGroupHover(null)}
              onClick={(event) => onGroupClick(groupId, event)}
              onContextMenu={(ev) => {
                ev.preventDefault();

                onGroupContextMenu(groupId, {
                  top: ev.clientY,
                  left: ev.clientX,
                });
              }}
            />
          );
        })}
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
