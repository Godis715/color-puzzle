import { ListItemText, Typography } from '@mui/material';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import LockIcon from '@mui/icons-material/Lock';
import DoneIcon from '@mui/icons-material/Done';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

import { selectLevels } from 'src/features/levels';

export function LevelsListPage(): JSX.Element {
  const levels = useSelector(selectLevels);

  return (
    <div>
      <Typography variant="h2">Levels</Typography>
      <List>
        {levels.map(({ id, isAvailable, isPassed, hasProgress }) => (
          <ListItemButton
            key={id}
            component={Link}
            to={id}
            disabled={!isAvailable}
          >
            <ListItemIcon>
              {!isAvailable && <LockIcon />}
              {isPassed && <DoneIcon color="success" />}
            </ListItemIcon>

            <ListItemText
              primary={`Level ${id}`}
              secondary={hasProgress && !isPassed ? 'Continue' : null}
            />
          </ListItemButton>
        ))}
      </List>
    </div>
  );
}
