import paper, { Tool, Path, Color } from 'paper';

import './App.css';
import { useEffect } from 'react';

function App() {
  useEffect(() => {
    paper.setup('canvas');
    // Create a simple drawing tool:
    const tool = new Tool();
    let path: paper.Path | undefined = undefined;

    // Define a mousedown and mousedrag handler
    tool.on('mousedown', (event: paper.ToolEvent) => {
      path = new Path();
      path!.strokeColor = new Color('black');
      path.add(event.point);
    });

    tool.on('mousedrag', (event: paper.ToolEvent) => {
      path!.add(event.point);
    });
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <canvas id="canvas" />
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
