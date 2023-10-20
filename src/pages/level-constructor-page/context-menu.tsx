import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { useSelector } from 'react-redux';

import {
  actions,
  selectGroups,
  selectHasSelection,
  selectIsMultiSelection,
  selectIsSingleSelection,
} from 'src/features/level-constructor';
import { useActions } from 'src/shared/hooks';

type Props = {
  groupId: string;
  anchorPosition: { top: number; left: number } | null;
  onClose: VoidFunction;
};

export function ContextMenu(props: Props): JSX.Element {
  const { groupId, anchorPosition, onClose: handleClose } = props;

  const groups = useSelector(selectGroups);
  const hasSelection = useSelector(selectHasSelection);
  const isSingleSelection = useSelector(selectIsSingleSelection);
  const isMultiSelection = useSelector(selectIsMultiSelection);

  const {
    toggleActiveGroupId,
    uniteActive,
    breakActive,
    toggleNeighbor,
    toggleGroupReady,
  } = useActions(actions);

  const group = groups.find(({ id }) => id === groupId);

  if (!group) return <></>;

  const { isActive, isActiveNeighbor, isReady } = group;

  const menuItems = [
    {
      label: 'Add to selection',
      onClick: () => toggleActiveGroupId(groupId),
      isVisible: hasSelection && !isActive,
    },
    {
      label: 'Deselect',
      onClick: () => toggleActiveGroupId(groupId),
      isVisible: isMultiSelection && isActive,
    },
    {
      label: 'Break',
      onClick: () => breakActive(),
      isVisible: isSingleSelection && isActive && group.fragmentIds.length > 1,
    },
    {
      label: isActiveNeighbor ? 'Mark as not neighbor' : 'Mark as neighbor',
      onClick: () => toggleNeighbor(groupId),
      isVisible: isSingleSelection && !isActive,
    },
    {
      label: isReady ? 'Mark as not ready' : 'Mark as ready',
      onClick: () => toggleGroupReady(groupId),
      isVisible: !hasSelection || (isSingleSelection && isActive),
    },
    {
      label: 'Unite',
      onClick: () => uniteActive(),
      isVisible: isMultiSelection && isActive,
    },
  ];

  return (
    <Menu
      open={anchorPosition !== null}
      onClose={handleClose}
      onClick={handleClose}
      anchorReference="anchorPosition"
      anchorPosition={anchorPosition ?? undefined}
      onContextMenu={(ev) => {
        ev.preventDefault();
        handleClose();
      }}
    >
      {menuItems
        .filter(({ isVisible }) => isVisible)
        .map(({ label, onClick }) => (
          <MenuItem onClick={onClick}>{label}</MenuItem>
        ))}
    </Menu>
  );
}
