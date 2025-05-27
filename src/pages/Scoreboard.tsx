import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ScoreTile from "../components/ScoreTile";
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
  const [showDetails, setShowDetails] = useState<boolean>(false);
  const [tempValues, setTempValues] = useState<number[]>([]);
  const [tempPoints, setTempPoints] = useState<number[]>([]);
  const [winner, setWinner] = useState<number>(0);
  const [viewMode, setViewMode] = useState<"vertical" | "horizontal">("vertical");
  const [showCongrats, setShowCongrats] = useState(false);
  const [winnerName, setWinnerName] = useState("");

  const navigate = useNavigate();

  const valueFactorFormula = (v: number) => (v * v + 3 * v) / 2;
  
  const getInitials = (name: string) => name.trim().slice(0, 3).toUpperCase();

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
      <main className="flex-grow px-4 py-6">
        <div className="max-w-7xl mx-auto space-y-6">
        {/* Header + buttons */}
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Scoreboard</h2>
          <div className="flex gap-2 flex-wrap">
            <Button onClick={() => setShowForm(!showForm)} disabled={rounds.length >= players.length}>
              <span className="block md:hidden uppercase truncate">➕</span>
              <span className="hidden md:block"> ➕ Round</span>
            </Button>
            <Button onClick={() => setShowDetails(!showDetails)} disabled={rounds.length === 0}>
              {showDetails ? ( 
                <><span className="block md:hidden uppercase truncate">🙈</span>
                <span className="hidden md:block"> Show Hands</span></>
              ) : ( 
                <><span className="block md:hidden uppercase truncate">👁</span>
                <span className="hidden md:block"> Hide Hands</span></>
              )}
            </Button>
            {rounds.length === players.length && players.length > 0 && (
                <Button onClick={handleExportCSV}>⬇️</Button>
              )}
          </div>
        </div>

        <div className="flex justify-between items-center flex-wrap w-full">
          
          <Button onClick={() => setViewMode(viewMode === "vertical" ? "horizontal" : "vertical")}>
            {viewMode === "vertical" ? 
            ( <>
              <span className="block md:hidden uppercase truncate">PLR ↓</span>
              <span className="hidden md:block"> Players ↓</span>
              </>
            ) : 
            (<>
            <span className="block md:hidden uppercase truncate">RND ↓</span>
                <span className="hidden md:block"> Round (TVF) ↓</span>
                </>)}
          </Button>
        </div>

        {/* Add Round Form */}
        {showForm && (
          <div className="border border-gray-400 p-4 rounded space-y-4">
            <div>
              <label className="font-medium">Select Winner: </label>
              <select
                className="ml-2 p-1 border border-gray-400 rounded"
                value={winner}
                onChange={(e) => setWinner(parseInt(e.target.value))}
              >
                {players.map((player, idx) => (
                  <option key={idx} value={idx}>
                    {getInitials(player)}
                  </option>
                ))}
              </select>
            </div>
            {players.map((player, index) => (
              <div key={index} className="grid grid-cols-4 items-center gap-2">
                <span className={`font-medium col-span-1 ${index === winner ? "text-green-600" : ""}`}>
                  <span className="block md:hidden uppercase truncate">{getInitials(player)}</span>
                  <span className="hidden md:block"> {player}</span> {index === winner && "(Winner)"}
                </span>
                <div className="col-span-1">
                  {(index === 0) && <label className="block text-sm font-semibold mb-1">Value</label>}
                  <Input
                    type="number"
                    value={tempValues[index]}
                    onChange={(e) => handleValueChange(index, parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="col-span-1">
                  {(index === 0) && <label className="block text-sm font-semibold mb-1">Point</label>}
                  <Input
                    type="number"
                    value={index === winner ? 0 : tempPoints[index]}
                    onChange={(e) => handlePointChange(index, parseInt(e.target.value) || 0)}
                    disabled={index === winner}
                  />
                </div>
                <div className="col-span-1 font-mono">
                  {showDetails && (
                    <>
                      VF: {valueFactorFormula(tempValues[index]).toFixed(0)}
                      <br />
                      Score:{" "}
                      {userScoreFormula(
                        players.length,
                        tempValues.reduce((sum, v) => sum + valueFactorFormula(v), 0),
                        valueFactorFormula(tempValues[index]),
                        index === winner ? 0 : tempPoints[index]
                      ).toFixed(0)}
                    </>
                  )}
                </div>
              </div>
            ))}
            <div className="text-center mt-4">
              <Button onClick={calculateScores} className="mr-2">
                Submit Round
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Show Congrats */}
        {showCongrats && (
          <div className="bg-green-100 border border-gray-400 border-green-400 text-green-800 p-3 rounded font-semibold text-center">
            🎉 Congratulations {winnerName}! 🎉
          </div>
        )}

        {/* Scoreboard */}

        {viewMode === "vertical" ? (
          <div className="overflow-x-auto w-full ">
            <div
              className="inline-grid  w-full"
              style={{
                gridTemplateColumns: `minmax(140px, 140px) repeat(${players.length}, minmax(80px, 1fr))`,
                minWidth: "max-content",
              }}
            >
              {/* Header */}
              <div
                className="sticky left-0 bg-white border border-gray-400 p-2 font-semibold z-20 text-center"
                style={{ gridColumn: "1" }}
              >
                <span className="block md:hidden uppercase truncate">RND ↓</span>
                <span className="hidden md:block"> Round (TVF) ↓</span>
              </div>
              {players.map((player, idx) => (
                <div key={idx} className="border border-gray-400 p-2 text-center font-semibold truncate bg-blue-100">
                  <span className="block md:hidden uppercase truncate">{getInitials(player)}</span>
                  <span className="hidden md:block"> {player}</span>
                </div>
              ))}

              {/* Rounds */}
              {rounds.map((round, rIdx) => (
                <React.Fragment key={rIdx}>
                  <div
                    className="sticky left-0 border border-gray-400 p-2 font-medium text-center z-10 bg-gray-100"
                    style={{ gridColumn: "1" }}
                  >
                    {rIdx + 1} ({round.totalValueFactor.toFixed(0)})
                  </div>
                  {round.scores.map((score, idx) => (
                    <div
                      key={idx}
                      className={`border border-gray-400 p-2 text-center 
                        ${
                          rIdx % 2 === 0 ? "bg-gray-200" : "bg-white"
                        }
                        ${
                        round.winner === idx ? "font-bold text-green-600" : ""
                      }`}
                    >
                      <ScoreTile
                        score={score.toFixed(0)}
                        valueFactor={valueFactorFormula(round.values[idx])}
                        Points={round.points[idx]}
                        showDetails={showDetails}
                      />
                    </div>
                  ))}
                </React.Fragment>
              ))}

              {/* Total Row */}
              <div
                className="sticky left-0 bg-yellow-200 border border-gray-400 p-2 font-semibold text-center"
                style={{ gridColumn: "1" }}
              >                
                <span className="block md:hidden uppercase truncate">TOT</span>
                <span className="hidden md:block">Total</span>
              </div>
              {totalScores.map((total, idx) => (
                <div key={idx} className="border border-gray-400 p-2 text-center font-semibold  bg-yellow-100">
                  {total.toFixed(0)}
                </div>
              ))}
            </div>
          </div>
        ) : (
          // Horizontal mode as CSS grid with fixed header row and first column
           <div className="overflow-x-auto w-full ">
            <div
              className="inline-grid  w-full"
              style={{
                gridTemplateColumns: `minmax(100px, 100px) repeat(${rounds.length + 1}, minmax(90px, 1fr))`,
                minWidth: "max-content",
                gridAutoRows: "minmax(40px, auto)",
              }}
            >
              {/* Top-left empty cell */}
              <div
                className="sticky top-0 left-0 bg-white border border-gray-400 p-2 font-semibold z-30 text-center"
                style={{ gridColumn: 1, gridRow: 1 }}
              >
                <span className="block md:hidden uppercase truncate">PLR ↓</span>
                <span className="hidden md:block"> Players ↓</span>
                
              </div>

              {/* Header row: Round 1, Round 2 ... Total */}
              {rounds.map((_, idx) => (
                <div
                  key={idx}
                  className="sticky top-0 border border-gray-400 p-2 font-semibold z-20 text-center bg-gray-200"
                  style={{ gridColumn: idx + 2, gridRow: 1 }}
                >
                  <span className="block md:hidden uppercase truncate">R{idx + 1}</span>
                  <span className="hidden md:block">Round {idx + 1}</span>
                </div>
              ))}

              <div
                className="sticky top-0 bg-yellow-200 border border-gray-400 p-2 font-semibold z-20 text-center"
                style={{ gridColumn: rounds.length + 2, gridRow: 1 }}
              >
                <span className="block md:hidden uppercase truncate">TOT</span>
                <span className="hidden md:block">Total</span>
              </div>

              {/* Player names column */}
              {players.map((player, pIdx) => (
                <div
                  key={pIdx}
                  className="sticky left-0 border border-gray-400 p-2 font-semibold z-20 text-left truncate bg-blue-100"
                  style={{ gridColumn: 1, gridRow: pIdx + 2 }}
                  title={player}
                >
                  <span className="block md:hidden uppercase truncate">{getInitials(player)}</span>
                  <span className="hidden md:block"> {player}</span>
                </div>
              ))}

              {/* Scores */}
              {rounds.map((round, rIdx) =>
                players.map((_, pIdx) => (
                  <div
                    key={`${rIdx}-${pIdx}`}
                    className={`border border-gray-400 p-2 text-center 
                      ${
                          pIdx % 2 === 0 ? "bg-gray-200" : "bg-white"
                        }
                      ${
                      round.winner === pIdx ? "font-bold text-green-600" : ""
                    }`}
                    style={{ gridColumn: rIdx + 2, gridRow: pIdx + 2 }}
                  >
                    <ScoreTile
                      score={round.scores[pIdx].toFixed(0)}
                      valueFactor={valueFactorFormula(round.values[pIdx])}
                      Points={round.points[pIdx]}
                      showDetails={showDetails}
                    />
                  </div>
                ))
              )}

              {/* Total scores row */}
              {players.map((_, pIdx) => (
                <div
                  key={`total-${pIdx}`}
                  className="border border-gray-400 p-2 font-semibold text-center bg-yellow-100"
                  style={{ gridColumn: rounds.length + 2, gridRow: pIdx + 2 }}
                >
                  {totalScores[pIdx].toFixed(0)}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2 mt-4 flex-wrap justify-center">
          <Button variant="destructive" onClick={handleResetGame}>
            Reset Game
          </Button>
          <Button variant="outline" onClick={handleStartNewGame}>
            Start New Game
          </Button>
        </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Scoreboard;
