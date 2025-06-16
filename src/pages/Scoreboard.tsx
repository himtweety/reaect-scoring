import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ScoreTile from "../components/ScoreTile";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { saveAs } from "file-saver";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface RoundData {
  values: number[];
  points: number[];
  scores: number[];
  winner: number;
  totalValueFactor: number;
  kickedPlayers?: number[];
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
  const [kickedPlayers, setKickedPlayers] = useState<number[]>([]);
  const [recalculateMode, setRecalculateMode] = useState<boolean>(false);

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

    // Get kicked players from the latest round
    const latestRound = storedRoundsRaw[storedRoundsRaw.length - 1];
    if (latestRound?.kickedPlayers) {
      setKickedPlayers(latestRound.kickedPlayers);
    }

    const normalizedRounds: RoundData[] = storedRoundsRaw.map((round: any) => {
      if (!round.scores) {
        const activePlayers = storedPlayers.length - (round.kickedPlayers?.length || 0);
        const valueFactors = round.values.map((value: number) => valueFactorFormula(value));
        const totalValueFactor = valueFactors.reduce((sum: number, val: number) => sum + val, 0);
        const rawScores = valueFactors.map(
          (vf: number, i: number) =>
            userScoreFormula(activePlayers, totalValueFactor, vf, round.points[i])
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
    rounds.reduce((acc, round) => {
      // Only count scores for active players or if the player was active in that round
      if (!kickedPlayers.includes(index) || !round.kickedPlayers?.includes(index)) {
        return acc + (round.scores?.[index] ?? 0);
      }
      return acc;
    }, 0)
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
    if (kickedPlayers.includes(index)) return; // Prevent changes for kicked players
    const updated = [...tempValues];
    updated[index] = Math.max(0, value);
    setTempValues(updated);
  };

  const handlePointChange = (index: number, value: number) => {
    if (index === winner || kickedPlayers.includes(index)) return; // Prevent changes for kicked players
    const updated = [...tempPoints];
    updated[index] = Math.min(10, Math.max(0, value));
    setTempPoints(updated);
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

  const handleKickPlayer = (playerIndex: number) => {
    if (window.confirm(`Are you sure you want to kick ${players[playerIndex]}?`)) {
      const newKickedPlayers = [...kickedPlayers, playerIndex];
      setKickedPlayers(newKickedPlayers);
      
      if (recalculateMode) {
        // Recalculate all rounds with the new player count
        const updatedRounds = rounds.map(round => {
          const activePlayers = players.length - newKickedPlayers.length;
          const valueFactors = round.values.map((value) => valueFactorFormula(value));
          const totalValueFactor = valueFactors.reduce((sum, val) => sum + val, 0);

          const adjustedPoints = [...round.points];
          adjustedPoints[round.winner] = 0;

          const rawScores = valueFactors.map((vf, i) =>
            userScoreFormula(activePlayers, totalValueFactor, vf, adjustedPoints[i])
          );
          const sumOfOthers = rawScores.reduce(
            (sum, score, i) => (i === round.winner ? sum : sum + score),
            0
          );
          rawScores[round.winner] = -sumOfOthers;

          return {
            ...round,
            scores: rawScores,
            totalValueFactor,
            kickedPlayers: newKickedPlayers
          };
        });
        setRounds(updatedRounds);
        localStorage.setItem("rounds", JSON.stringify(updatedRounds));
      } else {
        // Just mark the player as kicked in the current round
        const updatedRounds = rounds.map(round => ({
          ...round,
          kickedPlayers: newKickedPlayers
        }));
        setRounds(updatedRounds);
        localStorage.setItem("rounds", JSON.stringify(updatedRounds));
      }
    }
  };

  function calculateScores() {
    if (rounds.length >= players.length) {
      alert("Number of rounds cannot exceed number of players.");
      return;
    }

    const activePlayers = players.length - kickedPlayers.length;
    if (activePlayers < 2) {
      alert("Need at least 2 active players to continue the game.");
      return;
    }

    // Set values and points to 0 for kicked players
    const adjustedValues = tempValues.map((value, index) => 
      kickedPlayers.includes(index) ? 0 : value
    );
    const adjustedPoints = tempPoints.map((point, index) => 
      kickedPlayers.includes(index) ? 0 : point
    );

    const valueFactors = adjustedValues.map((value) => valueFactorFormula(value));
    const totalValueFactor = valueFactors.reduce((sum, val) => sum + val, 0);

    // Set winner's points to 0
    adjustedPoints[winner] = 0;

    const rawScores = valueFactors.map((vf, i) =>
      kickedPlayers.includes(i) ? 0 : // Set score to 0 for kicked players
      userScoreFormula(activePlayers, totalValueFactor, vf, adjustedPoints[i])
    );
    const sumOfOthers = rawScores.reduce(
      (sum, score, i) => (i === winner ? sum : sum + score),
      0
    );
    rawScores[winner] = -sumOfOthers;

    const newRound: RoundData = {
      values: adjustedValues,
      points: adjustedPoints,
      scores: rawScores,
      winner,
      totalValueFactor,
      kickedPlayers: [...kickedPlayers]
    };

    const updatedRounds = [...rounds, newRound];
    setRounds(updatedRounds);
    localStorage.setItem("rounds", JSON.stringify(updatedRounds));

    setTempValues(new Array(players.length).fill(0));
    setTempPoints(new Array(players.length).fill(0));
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
      setKickedPlayers([]);
      localStorage.setItem("rounds", JSON.stringify([]));
      setShowForm(false);
      setShowCongrats(false);
      setWinnerName("");
    }
  };

  const handleRemoveKickedPlayers = () => {
    if (kickedPlayers.length === 0) {
      alert("No players have been kicked out.");
      return;
    }

    if (window.confirm("Are you sure you want to permanently remove all kicked players? This will recalculate all rounds with remaining players.")) {
      // Remove kicked players from the players array
      const remainingPlayers = players.filter((_, index) => !kickedPlayers.includes(index));
      setPlayers(remainingPlayers);
      localStorage.setItem("players", JSON.stringify(remainingPlayers));

      // Recalculate all rounds with remaining players
      const updatedRounds = rounds.map(round => {
        const activePlayers = remainingPlayers.length;
        const remainingValues = round.values.filter((_, index) => !kickedPlayers.includes(index));
        const remainingPoints = round.points.filter((_, index) => !kickedPlayers.includes(index));
        
        // Adjust winner index for remaining players
        const newWinnerIndex = remainingPlayers.findIndex((_, index) => 
          players.indexOf(remainingPlayers[index]) === round.winner
        );

        const valueFactors = remainingValues.map(value => valueFactorFormula(value));
        const totalValueFactor = valueFactors.reduce((sum, val) => sum + val, 0);

        const adjustedPoints = [...remainingPoints];
        adjustedPoints[newWinnerIndex] = 0;

        const rawScores = valueFactors.map((vf, i) =>
          userScoreFormula(activePlayers, totalValueFactor, vf, adjustedPoints[i])
        );
        const sumOfOthers = rawScores.reduce(
          (sum, score, i) => (i === newWinnerIndex ? sum : sum + score),
          0
        );
        rawScores[newWinnerIndex] = -sumOfOthers;

        return {
          values: remainingValues,
          points: remainingPoints,
          scores: rawScores,
          winner: newWinnerIndex,
          totalValueFactor
        };
      });

      setRounds(updatedRounds);
      setKickedPlayers([]);
      localStorage.setItem("rounds", JSON.stringify(updatedRounds));
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
                <><span className="block md:hidden uppercase truncate">👁</span>
                <span className="hidden md:block"> Show Hands</span></>
              ) : ( 
                <><span className="block md:hidden uppercase truncate">🙈</span>
                <span className="hidden md:block"> Hide Hands</span></>
              )}
            </Button>
            {rounds.length === players.length && players.length > 0 && (
                <Button onClick={handleExportCSV}>⬇️</Button>
              )}
          </div>
        </div>

        {/* Kick Player Mode Toggle */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="recalculateMode"
              checked={recalculateMode}
              onChange={(e) => setRecalculateMode(e.target.checked)}
              className="h-4 w-4"
            />
            <label htmlFor="recalculateMode" className="text-sm font-medium">
              Recalculate scores when kicking players
            </label>
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
            <div className="grid grid-cols-4 items-center gap-2">
              <label className="font-medium col-span-1"> Winner: </label>
              <span className="col-span-3 w-full max-w-sm">
                <Select
                  value={winner.toString()}
                  onValueChange={(val) => setWinner(parseInt(val))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select winner" />
                  </SelectTrigger>
                  <SelectContent>
                    {players.map((player, idx) => (
                      !kickedPlayers.includes(idx) && (
                        <SelectItem key={idx} value={idx.toString()}>
                          {getInitials(player)}
                        </SelectItem>
                      )
                    ))}
                  </SelectContent>
                </Select>
              </span>
            </div>
            {players.map((player, index) => (
              <div key={index} className={`grid grid-cols-4 items-center gap-2 ${
                kickedPlayers.includes(index) ? 'opacity-50' : ''
              }`}>
                <span className={`font-medium col-span-1 ${index === winner ? "text-green-600" : ""}`}>
                  <span className="block md:hidden uppercase truncate">{getInitials(player)}</span>
                  <span className="hidden md:block"> {player}</span> {index === winner && "(Winner)"}
                </span>
                <div className="col-span-1">
                  {(index === 0) && <label className="block text-sm font-semibold mb-1">Value</label>}
                  <Select
                    value={tempValues[index].toString()}
                    onValueChange={(val) => handleValueChange(index, parseInt(val))}
                    disabled={kickedPlayers.includes(index)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select value" defaultValue="0">
                        {tempValues[index] !== undefined ? tempValues[index] : "Select value"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 23 }, (_, i) => (
                        <SelectItem key={i} value={i.toString()}>
                          {i}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-1">
                  {(index === 0) && <label className="block text-sm font-semibold mb-1">Point</label>}
                  <Select
                    value={index === winner ? "0" : tempPoints[index]?.toString()}
                    onValueChange={(value) => handlePointChange(index, parseInt(value))}
                    disabled={index === winner || kickedPlayers.includes(index)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select value" defaultValue="0">
                        {tempPoints[index] !== undefined ? tempPoints[index] : "Select value"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 11 }, (_, i) => (
                        <SelectItem key={i} value={i.toString()}>
                          {i}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-1 font-mono">
                  {showDetails && (
                    <>
                    <div className="flex items-center gap-1">
                      <span className="block md:hidden uppercase truncate">VF: {valueFactorFormula(tempValues[index]).toFixed(0)}</span>
                      <span className="hidden md:block">Value Factor: {valueFactorFormula(tempValues[index]).toFixed(0)}</span>
                    </div>  
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
                <div key={idx} className={`border border-gray-400 p-2 text-center font-semibold truncate ${
                  kickedPlayers.includes(idx) ? 'bg-gray-300' : 'bg-blue-100'
                }`}>
                  <div className="flex items-center justify-between">
                    <span>
                      <span className="block md:hidden uppercase truncate">{getInitials(player)}</span>
                      <span className="hidden md:block"> {player}</span>
                    </span>
                    {!kickedPlayers.includes(idx) && (
                      <button
                        onClick={() => handleKickPlayer(idx)}
                        className="text-red-600 hover:text-red-800 ml-2"
                        title="Kick player"
                      >
                        🚫
                      </button>
                    )}
                  </div>
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
                          kickedPlayers.includes(idx) ? 'bg-gray-300 opacity-50' :
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
                <div key={idx} className={`border border-gray-400 p-2 text-center font-semibold ${
                  kickedPlayers.includes(idx) ? 'bg-gray-300' : 'bg-yellow-100'
                }`}>
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
                  className={`sticky left-0 border border-gray-400 p-2 font-semibold z-20 text-left truncate ${
                    kickedPlayers.includes(pIdx) ? 'bg-gray-300' : 'bg-blue-100'
                  }`}
                  style={{ gridColumn: 1, gridRow: pIdx + 2 }}
                  title={player}
                >
                  <div className="flex items-center justify-between">
                    <span>
                      <span className="block md:hidden uppercase truncate">{getInitials(player)}</span>
                      <span className="hidden md:block"> {player}</span>
                    </span>
                    {!kickedPlayers.includes(pIdx) && (
                      <button
                        onClick={() => handleKickPlayer(pIdx)}
                        className="text-red-600 hover:text-red-800 ml-2"
                        title="Kick player"
                      >
                        🚫
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {/* Scores */}
              {rounds.map((round, rIdx) =>
                players.map((_, pIdx) => (
                  <div
                    key={`${rIdx}-${pIdx}`}
                    className={`border border-gray-400 p-2 text-center 
                      ${
                        kickedPlayers.includes(pIdx) ? 'bg-gray-300 opacity-50' :
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
                  className={`border border-gray-400 p-2 font-semibold text-center ${
                    kickedPlayers.includes(pIdx) ? 'bg-gray-300' : 'bg-yellow-100'
                  }`}
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
          {kickedPlayers.length > 0 && (
            <Button 
              variant="destructive" 
              onClick={handleRemoveKickedPlayers}
              className="bg-red-700 hover:bg-red-800"
            >
              Remove Kicked Players
            </Button>
          )}
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
