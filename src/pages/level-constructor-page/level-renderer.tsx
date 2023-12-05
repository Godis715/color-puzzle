import { cn } from '@bem-react/classname';
import SVG from 'react-inlinesvg';

import { Fragment, Decorations } from 'src/features/level-constructor';

type Props = {
  fragments: Fragment[];
  decorations: Decorations | null;

  getFragmentGroupId: (id: string) => string;
  getGroupColor: (id: string) => string;
  getGroupClassName?: (id: string) => string;

  onGroupHover?: (id: string | null, ev: React.MouseEvent) => void;
  onGroupClick?: (id: string, ev: React.MouseEvent) => void;
  onGroupMouseDown?: (id: string, ev: React.MouseEvent) => void;
  onGroupMouseUp?: (id: string, ev: React.MouseEvent) => void;
  onGroupContextMenu?: (
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
    onGroupMouseDown,
    onGroupMouseUp,
    getGroupClassName,
  } = props;

  return (
    <div className="viewport">
      <svg viewBox="0 0 100 100">
        {fragments.map((fragment) => {
          const groupId = getFragmentGroupId(fragment.id);

          const mixClassName = getGroupClassName?.(groupId);
          const className = cnFragment(null, mixClassName);

          const handleMouseDown =
            onGroupMouseDown &&
            ((event: React.MouseEvent) => onGroupMouseDown(groupId, event));

          const handleMouseUp =
            onGroupMouseUp &&
            ((event: React.MouseEvent) => onGroupMouseUp(groupId, event));

          const handleMouseEnter =
            onGroupHover &&
            ((event: React.MouseEvent) => onGroupHover(groupId, event));

          const handleMouseLeave =
            onGroupHover &&
            ((event: React.MouseEvent) => onGroupHover(null, event));

          const handleClick =
            onGroupClick &&
            ((event: React.MouseEvent) => onGroupClick(groupId, event));

          const handleContextMenu =
            onGroupContextMenu &&
            ((ev: React.MouseEvent) => {
              ev.preventDefault();

              onGroupContextMenu(groupId, {
                top: ev.clientY,
                left: ev.clientX,
              });
            });

          return (
            <path
              key={fragment.id}
              id={fragment.id}
              className={className}
              d={fragment.data}
              fill={getGroupColor(groupId)}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              onClick={handleClick}
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
              onContextMenu={handleContextMenu}
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
