// src/pages/Home.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const Home: React.FC = () => {
  const [numPlayers, setNumPlayers] = useState(2);
  const [playerNames, setPlayerNames] = useState<string[]>([]);
  const [error, setError] = useState<string>("");

  const navigate = useNavigate();

  const handleNumPlayersChange = (value: number) => {
    if (value < 2) {
      setNumPlayers(2);
    } else if (value > 10) {
      setNumPlayers(10);
      setError("Maximum 10 players allowed.");
    } else {
      setNumPlayers(value);
      setError("");
    }
    setPlayerNames(new Array(Math.min(value, 10)).fill(""));
  };

  const handleNameChange = (index: number, name: string) => {
    const updatedNames = [...playerNames];
    updatedNames[index] = name;
    setPlayerNames(updatedNames);
  };

  const handleStartGame = () => {
    if (playerNames.length !== numPlayers) {
      setError("Please enter all player names.");
      return;
    }
    for (const name of playerNames) {
      if (!name.trim()) {
        setError("Player names cannot be empty.");
        return;
      }
    }

    localStorage.setItem("players", JSON.stringify(playerNames.slice(0, 10)));
    localStorage.setItem("rounds", JSON.stringify([])); // clear rounds on new game
    navigate("/scoreboard");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold mb-6">Start New Game</h1>

      <div className="mb-4">
        <label className="block font-semibold mb-2">Number of Players (2-10):</label>
        <Input
          type="number"
          min={2}
          max={10}
          value={numPlayers}
          inputMode="numeric"
          onChange={(e) => handleNumPlayersChange(parseInt(e.target.value) || 2)}
        />
        {error && <p className="text-red-600 mt-1">{error}</p>}
      </div>

      {new Array(numPlayers).fill(null).map((_, idx) => (
        <div key={idx} className="mb-3 w-full max-w-sm">
          <label className="block mb-1 font-medium">Player {idx + 1} Name:</label>
          <Input
            type="text"
            placeholder={`Player ${idx + 1}`}
            value={playerNames[idx] || ""}
            onChange={(e) => handleNameChange(idx, e.target.value)}
          />
        </div>
      ))}

      <Button onClick={handleStartGame} className="mt-4">Start Game</Button>
    </div>
  );
};

export default Home;
