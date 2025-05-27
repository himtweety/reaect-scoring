import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { saveAs } from "file-saver";

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
  const [viewMode, setViewMode] = useState<"vertical" | "horizontal">("vertical");
  const [editingRoundIndex, setEditingRoundIndex] = useState<number | null>(null);
  const [showCongrats, setShowCongrats] = useState(false);
  const [winnerName, setWinnerName] = useState("");

  const navigate = useNavigate();

  const valueFactorFormula = (v: number) => (v * v + 3 * v) / 2;

  const userScoreFormula = (
    totalPlayers: number,
    totalValueFactor: number,
    userValueFactor: number,
    userPoints: number
  ) => userValueFactor * totalPlayers - (totalValueFactor + userPoints);

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
          (vf: number, i: number) =>
            userScoreFormula(numPlayers, totalValueFactor, vf, round.points[i])
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

  const totalScores = players.map((_, index) =>
    rounds.reduce((acc, round) => acc + (round.scores?.[index] ?? 0), 0)
  );

  useEffect(() => {
    if (rounds.length === players.length && players.length > 0) {
      const maxScore = Math.max(...totalScores);
      const winnerIndex = totalScores.findIndex(score => score === maxScore);
      setWinnerName(players[winnerIndex]);
      setShowCongrats(true);
    }
  }, [rounds]);

  const handleValueChange = (index: number, value: number) => {
    const updated = [...tempValues];
    updated[index] = Math.max(0, value);
    setTempValues(updated);
  };

  const handlePointChange = (index: number, value: number) => {
    if (index === winner) return;
    const updated = [...tempPoints];
    updated[index] = Math.min(10, Math.max(0, value));
    setTempPoints(updated);
  };

  function calculateScores() {
    if (rounds.length >= players.length) {
      alert("Number of rounds cannot exceed number of players.");
      return;
    }

    const numPlayers = players.length;
    const valueFactors = tempValues.map((value) => valueFactorFormula(value));
    const totalValueFactor = valueFactors.reduce((sum, val) => sum + val, 0);

    const adjustedPoints = [...tempPoints];
    adjustedPoints[winner] = 0;

    const rawScores = valueFactors.map((vf, i) =>
      userScoreFormula(numPlayers, totalValueFactor, vf, adjustedPoints[i])
    );
    const sumOfOthers = rawScores.reduce(
      (sum, score, i) => (i === winner ? sum : sum + score),
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

    setTempValues(new Array(numPlayers).fill(0));
    setTempPoints(new Array(numPlayers).fill(0));
    setWinner(0);
    setShowForm(false);
  }

  const handleEditRound = (roundIdx: number) => {
    setEditingRoundIndex(roundIdx);
  };

  const handleSaveEdit = (roundIdx: number, updated: RoundData) => {
    const updatedRounds = [...rounds];
    updatedRounds[roundIdx] = updated;
    setRounds(updatedRounds);
    localStorage.setItem("rounds", JSON.stringify(updatedRounds));
    setEditingRoundIndex(null);
  };

  const handleExportCSV = () => {
    const headers = ["Round", ...players];
    const rows = rounds.map((round, i) => [
      `Round ${i + 1}`,
      ...round.scores.map((s) => s.toFixed(0)),
    ]);
    const totalRow = ["Total", ...totalScores.map((t) => t.toFixed(0))];

    const csvContent = [headers, ...rows, totalRow]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, "scoreboard.csv");
  };

  const handleResetGame = () => {
    if (window.confirm("Are you sure you want to reset the current game?")) {
      setRounds([]);
      localStorage.setItem("rounds", JSON.stringify([]));
      setShowForm(false);
      setShowCongrats(false);
      setWinnerName("");
    }
  };

  const handleStartNewGame = () => {
    if (window.confirm("Are you sure you want to start a new game?")) {
      localStorage.removeItem("players");
      localStorage.removeItem("rounds");
      navigate("/");
      setShowCongrats(false);
      setWinnerName("");
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow p-4 overflow-x-auto space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Scoreboard</h2>
          <div className="flex gap-2 flex-wrap">
            <Button onClick={() => setViewMode(viewMode === "vertical" ? "horizontal" : "vertical")}>
              Switch to {viewMode === "vertical" ? "Horizontal" : "Vertical"}
            </Button>

            {rounds.length === players.length && players.length > 0 && (
              <Button onClick={handleExportCSV}>Export CSV</Button>
            )}

            <Button onClick={() => setShowForm(!showForm)} disabled={rounds.length >= players.length}>
              Add Round Data
            </Button>
          </div>

        </div>

        {/* Form rendering here */}
        {showForm && (
          <div className="border p-4 rounded space-y-4">
            <div>
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

            {players.map((player, index) => (
              <div key={index} className="grid grid-cols-4 items-center gap-2">
                <span className={`font-medium col-span-1 ${index === winner ? "text-green-600" : ""}`}>
                  {player} {index === winner && "(Winner)"}
                </span>

                <div className="col-span-1">
                  <label className="block text-sm font-semibold mb-1">Value</label>
                  <Input
                    type="number"
                    value={tempValues[index]}
                    onChange={(e) => handleValueChange(index, parseInt(e.target.value) || 0)}
                  />
                </div>

                <div className="col-span-1">
                  <label className="block text-sm font-semibold mb-1">Point</label>
                  <Input
                    type="number"
                    value={index === winner ? 0 : tempPoints[index]}
                    onChange={(e) => handlePointChange(index, parseInt(e.target.value) || 0)}
                    disabled={index === winner}
                  />
                </div>
              </div>
            ))}

            <Button className="mt-4" onClick={calculateScores}>Save Round</Button>
          </div>
        )}

        {/* Table rendering */}
        {viewMode === "vertical" ? (
          <table className="min-w-full border">
            <thead>
              <tr>
                <th className="border p-2">Round (TVF)</th>
                {players.map((player, idx) => (
                  <th key={idx} className="border p-2">{player}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rounds.map((round, rIdx) => (
                <tr key={rIdx}>
                  <td className="border p-2 text-center">
                    {rIdx + 1} ({round.totalValueFactor.toFixed(0)})
                  </td>
                  {round.scores.map((score, idx) => (
                    <td key={idx} className={`border p-2 text-center ${round.winner === idx ? "font-bold text-green-600" : ""}`}>
                      {score.toFixed(0)} ({valueFactorFormula(round.values[idx])}, {round.points[idx]})
                    </td>
                  ))}
                </tr>
              ))}
              <tr>
                <td className="border p-2 font-semibold text-center">Total</td>
                {totalScores.map((total, idx) => (
                  <td key={idx} className="border p-2 text-center font-semibold">{total.toFixed(0)}</td>
                ))}
              </tr>
            </tbody>
          </table>
        ) : (
          <table className="min-w-full border">
            <thead>
              <tr>
                <th className="border p-2">Player</th>
                {rounds.map((_, idx) => (
                  <th key={idx} className="border p-2">R{idx + 1}</th>
                ))}
                <th className="border p-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {players.map((player, pIdx) => (
                <tr key={pIdx}>
                  <td className="border p-2 font-medium">{player}</td>
                  {rounds.map((round, rIdx) => (
                    <td key={rIdx} className={`border p-2 text-center ${round.winner === pIdx ? "font-bold text-green-600" : ""}`}>
                      {round.scores[pIdx].toFixed(0)}
                    </td>
                  ))}
                  <td className="border p-2 font-semibold text-center">{totalScores[pIdx].toFixed(0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Action buttons */}
        <div className="flex justify-center gap-4 mt-6">
          <Button variant="outline" onClick={handleResetGame}>Reset Game</Button>
          <Button variant="destructive" onClick={handleStartNewGame}>Start New Game</Button>
        </div>

        {/* Congrats Modal */}
        {showCongrats && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-xl shadow-xl text-center space-y-4 max-w-sm w-full">
              <h2 className="text-2xl font-bold text-green-600">🎉 Congratulations!</h2>
              <p className="text-lg">Player <span className="font-semibold">{winnerName}</span> is the winner!</p>
              <Button onClick={() => setShowCongrats(false)}>Close</Button>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Scoreboard;
