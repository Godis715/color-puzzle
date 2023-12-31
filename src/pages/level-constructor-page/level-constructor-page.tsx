import { useState } from 'react';

import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Grid from '@mui/material/Grid';

import { LevelPreviewTab } from './level-preview-tab';
import { LevelEditorTab } from './level-editor-tab';
import './style.scss';

enum TabName {
  Editor = 'editor',
  Preview = 'preview',
}

export function LevelConstructorPage(): JSX.Element {
  const [tab, setTab] = useState<TabName>(TabName.Editor);

  return (
    <Box display="flex" flexDirection="column" alignItems="center">
      <Grid
        container
        columnSpacing={2}
        sx={{ maxWidth: '600px', marginTop: 3 }}
      >
        <Grid item xs={8}>
          <Tabs
            value={tab}
            centered
            onChange={(_, value: TabName) => setTab(value)}
          >
            <Tab label="Editor" value={TabName.Editor} />
            <Tab label="Preview" value={TabName.Preview} />
          </Tabs>
        </Grid>

        <Grid item xs={4} />

        {tab === TabName.Editor && <LevelEditorTab />}

        {tab === TabName.Preview && <LevelPreviewTab />}
      </Grid>
    </Box>
  );
}
