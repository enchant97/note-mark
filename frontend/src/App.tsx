import { Routes, Route, Router } from '@solidjs/router';
import { Component, lazy } from 'solid-js';

const Index = lazy(() => import("./pages/index"));

const App: Component = () => {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/" component={Index} />
        </Routes>
      </Router>
    </>
  );
};

export default App;
