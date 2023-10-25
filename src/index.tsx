import { Provider } from 'react-redux';
import ReactDOM from 'react-dom/client';
import { persistStore } from 'redux-persist';
import { PersistGate } from 'redux-persist/integration/react';
import { createHashRouter, Outlet, RouterProvider } from 'react-router-dom';

import { store } from 'src/store';

import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

import './index.css';
import { LevelConstructorPage } from './pages/level-constructor-page';
import { LevelsListPage } from './pages/levels-list-page/levels-list-page';
import { LevelPage } from './pages/level-page/level-page';

const router = createHashRouter([
  {
    path: '/',
    element: <Outlet />,
    errorElement: <>Error</>,
    children: [
      {
        path: 'constructor',
        element: <LevelConstructorPage />,
      },
      {
        path: '',
        element: <Outlet />,
        children: [
          {
            path: '',
            element: <LevelsListPage />,
          },
          {
            path: ':levelId',
            element: <LevelPage />,
          },
        ],
      },
    ],
  },
]);

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

const persistor = persistStore(store);

root.render(
  <Provider store={store}>
    <PersistGate loading={null} persistor={persistor}>
      <RouterProvider router={router} />
    </PersistGate>
  </Provider>
);
