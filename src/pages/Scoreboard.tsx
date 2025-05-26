import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";

interface RoundData {
  values: number[];
  points: number[];
  scores: number[];
  winner: number;
  totalValueFactor: number;
}

const Scoreboard: React.FC = () => {
  const [players, setPlayers] = useState<string[]>([]);
  const [rounds, setRounds] = useState<RoundData[]>([]);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [tempValues, setTempValues] = useState<number[]>([]);
  const [tempPoints, setTempPoints] = useState<number[]>([]);
  const [winner, setWinner] = useState<number>(0);

  const navigate = useNavigate();

  const valueFactorFormula = (v: number) => {
    return (v * v + 3 * v) / 2;
  };

  const userScoreFormula = (
    totalPlayers: number,
    totalValueFactor: number,
    userValueFactor: number,
    userPoints: number
  ) => (userValueFactor * totalPlayers) - (totalValueFactor + userPoints);

  useEffect(() => {
    const storedPlayers = JSON.parse(localStorage.getItem("players") || "[]");
    setPlayers(storedPlayers);
    setTempValues(new Array(storedPlayers.length).fill(0));
    setTempPoints(new Array(storedPlayers.length).fill(0));

    const storedRoundsRaw = JSON.parse(localStorage.getItem("rounds") || "[]");

    const normalizedRounds: RoundData[] = storedRoundsRaw.map((round: any) => {
      if (!round.scores) {
        const numPlayers = storedPlayers.length;
        const valueFactors = round.values.map((value: number) => valueFactorFormula(value));
        const totalValueFactor = valueFactors.reduce((sum: number, val: number) => sum + val, 0);
        const rawScores = valueFactors.map(
          (vf: number, i: number) => userScoreFormula(numPlayers, totalValueFactor, vf, round.points[i])
        );
        const sumOfOthers = rawScores.reduce(
          (sum: number, score: number, i: number) => (i === round.winner ? sum : sum + score),
          0
        );
        rawScores[round.winner] = -sumOfOthers;

        return {
          ...round,
          scores: rawScores,
          totalValueFactor,
        };
      }
      return round;
    });

    setRounds(normalizedRounds);
  }, []);

  const handleValueChange = (index: number, value: number) => {
    const updated = [...tempValues];
    updated[index] = Math.max(0, value);
    setTempValues(updated);
  };

  const handlePointChange = (index: number, value: number) => {
    if (index === winner) return;

    const updated = [...tempPoints];
    updated[index] = Math.min(10, Math.max(0, value)); // Clamp between 0 and 10
    setTempPoints(updated);
  };

  function calculateScores() {
    if (rounds.length >= players.length) {
      alert("Number of rounds cannot exceed number of players.");
      return;
    }

    const numPlayers = players.length;
    const valueFactors = tempValues.map((value) => valueFactorFormula(value));
    const totalValueFactor = valueFactors.reduce((sum: number, val: number) => sum + val, 0);

    // Ensure winner's point is zero before calculating
    const adjustedPoints = [...tempPoints];
    adjustedPoints[winner] = 0;

    const rawScores = valueFactors.map((vf, i) =>
      userScoreFormula(numPlayers, totalValueFactor, vf, adjustedPoints[i])
    );
    const sumOfOthers = rawScores.reduce(
      (sum: number, score: number, i: number) => (i === winner ? sum : sum + score),
      0
    );
    rawScores[winner] = -sumOfOthers;

    const newRound: RoundData = {
      values: [...tempValues],
      points: adjustedPoints,
      scores: rawScores,
      winner,
      totalValueFactor,
    };

    const updatedRounds = [...rounds, newRound];
    setRounds(updatedRounds);
    localStorage.setItem("rounds", JSON.stringify(updatedRounds));

    // Reset inputs after adding new round
    setTempValues(new Array(numPlayers).fill(0));
    setTempPoints(new Array(numPlayers).fill(0));
    setWinner(0);

    setShowForm(false);
  }

  const totalScores = players.map((_, index) =>
    rounds.reduce((acc, round) => acc + (round.scores?.[index] ?? 0), 0)
  );

  const handleResetGame = () => {
    if (
      window.confirm(
        "Are you sure you want to reset the current game? This will clear all rounds but keep the players."
      )
    ) {
      setRounds([]);
      localStorage.setItem("rounds", JSON.stringify([]));
      setShowForm(false);
    }
  };

  const handleStartNewGame = () => {
    if (
      window.confirm(
        "Are you sure you want to start a new game? This will clear all players and rounds and take you back to the home page."
      )
    ) {
      localStorage.removeItem("players");
      localStorage.removeItem("rounds");
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow p-4 overflow-x-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Scoreboard</h2>
          {/* Disable Add Round Data button if rounds reached players count */}
          <Button
            onClick={() => setShowForm(!showForm)}
            disabled={rounds.length >= players.length}
            title={rounds.length >= players.length ? "Max rounds reached" : undefined}
          >
            Add Round Data
          </Button>
        </div>

        {showForm && (
          <div className="mb-6 border p-4 rounded space-y-4">
            {/* Winner selection first */}
            <div className="mb-4">
              <label className="font-medium">Select Winner: </label>
              <select
                className="ml-2 p-1 border rounded"
                value={winner}
                onChange={(e) => setWinner(parseInt(e.target.value))}
              >
                {players.map((player, idx) => (
                  <option key={idx} value={idx}>
                    {player}
                  </option>
                ))}
              </select>
            </div>

            {/* Inputs for each player */}
            {players.map((player, index) => (
              <div key={index} className="grid grid-cols-4 items-center gap-2">
                <span className={`font-medium col-span-1 ${index === winner ? "text-green-600" : ""}`}>
                  {player} {index === winner && "(Winner)"}
                </span>

                <div className="col-span-1">
                  <label className={`block text-sm font-semibold mb-1 ${index === winner ? "text-green-600" : ""}`}>
                    Value
                  </label>
                  <Input
                    type="number"
                    placeholder="Value"
                    min={0}
                    value={tempValues[index]}
                    onChange={(e) => handleValueChange(index, parseInt(e.target.value) || 0)}
                  />
                </div>

                <div className="col-span-1">
                  <label className={`block text-sm font-semibold mb-1 ${index === winner ? "text-green-600" : ""}`}>
                    Point
                  </label>
                  <Input
                    type="number"
                    placeholder="Point"
                    min={0}
                    max={10} // 👈 This helps with UI enforcement
                    value={index === winner ? 0 : tempPoints[index]}
                    onChange={(e) => handlePointChange(index, parseInt(e.target.value) || 0)}
                    disabled={index === winner}
                  />
                </div>
              </div>
            ))}

            <Button className="mt-4" onClick={calculateScores}>
              Save Round
            </Button>
          </div>
        )}

        <table className="min-w-full border border-gray-300">
          <thead>
            <tr>
              <th className="border p-2">Round (TVF)</th>
              {players.map((player, idx) => (
                <th key={idx} className="border p-2">
                  {player}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rounds.map((round, rIdx) => (
              <tr key={rIdx}>
                <td className="border p-2 text-center">
                  {rIdx + 1} ( {round.totalValueFactor.toFixed(0)} )
                </td>
                {round.values.map((value, idx) => (
                  <td
                    key={idx}
                    className={`border p-2 text-center ${
                      round.winner === idx ? "font-bold text-green-600" : ""
                    }`}
                  >
                    {round.scores[idx].toFixed(0)} (
                    {valueFactorFormula(value)}, {round.points[idx]})
                  </td>
                ))}
              </tr>
            ))}
            <tr>
              <td className="border p-2 font-semibold text-center">Total</td>
              {totalScores.map((total, idx) => (
                <td key={idx} className="border p-2 text-center font-semibold">
                  {total.toFixed(0)}
                </td>
              ))}
            </tr>
          </tbody>
        </table>

        {/* Buttons at bottom */}
        <div className="mt-6 flex justify-center space-x-4">
          <Button variant="outline" onClick={handleResetGame}>
            Reset Game
          </Button>
          <Button variant="destructive" onClick={handleStartNewGame}>
            Start New Game
          </Button>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Scoreboard;
