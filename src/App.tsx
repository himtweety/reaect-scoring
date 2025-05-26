import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Scoreboard from "./pages/Scoreboard";

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/scoreboard" element={<Scoreboard />} />
      </Routes>
    </Router>
  );
};

export default App;