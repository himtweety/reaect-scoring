// src/pages/Home.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

    const trimmedNames = playerNames.map(name => name.trim());
    if (trimmedNames.some(name => name === "")) {
      setError("Player names cannot be empty.");
      return;
    }

    const duplicateIndices = getDuplicateNameIndices(trimmedNames);
    if (duplicateIndices.size > 0) {
      setError("Player names must be unique.");
      return;
    }


    localStorage.setItem("players", JSON.stringify(trimmedNames.slice(0, 10)));
    localStorage.setItem("rounds", JSON.stringify([])); // clear rounds on new game
    navigate("/scoreboard");
  };
  const getDuplicateNameIndices = (names: string[]) => {
    const nameMap: Record<string, number[]> = {};
    names.forEach((name, idx) => {
      const key = name.trim().toLowerCase();
      if (!key) return;
      if (!nameMap[key]) {
        nameMap[key] = [];
      }
      nameMap[key].push(idx);
    });

    const duplicates = new Set<number>();
    Object.values(nameMap).forEach((indices) => {
      if (indices.length > 1) {
        indices.forEach((i) => duplicates.add(i));
      }
    });

    return duplicates;
  };


  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold mb-6">Start New Game</h1>

      <div className="mb-4 w-full max-w-sm">
        <label className="block font-semibold mb-2">Number of Players (2-10):</label>
        
        <Select value={String(numPlayers)} onValueChange={(value) => handleNumPlayersChange(Number(value))}>
          <SelectTrigger className="w-full border px-4 py-2 rounded-md text-left">
            <SelectValue placeholder="Select number of players" />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: 9 }, (_, i) => i + 2).map((n) => (
              <SelectItem key={n} value={String(n)}>
                {n}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {error && <p className="text-red-600 mt-1">{error}</p>}
      </div>

      {new Array(numPlayers).fill(null).map((_, idx) => {
        const duplicateIndices = getDuplicateNameIndices(playerNames);
        const isDuplicate = duplicateIndices.has(idx);

        return (
          <div key={idx} className="mb-3 w-full max-w-sm">
            <label className="block mb-1 font-medium">Player {idx + 1} Name:</label>
            <Input
              type="text"
              placeholder={`Player ${idx + 1}`}
              value={playerNames[idx] || ""}
              onChange={(e) => handleNameChange(idx, e.target.value)}
              className={isDuplicate ? "border-red-500" : ""}
            />
            {isDuplicate && (
              <p className="text-sm text-red-600 mt-1">Name must be unique</p>
            )}
          </div>
        );
      })}


      <Button onClick={handleStartGame} className="mt-4">Start Game</Button>
    </div>
  );
};

export default Home;
