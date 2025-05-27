import React from "react";

interface RoundData {
  values: number[];
  points: number[];
  scores: number[];
  winner: number;
  totalValueFactor: number;
}

interface ColumnViewProps {
  players: string[];
  rounds: RoundData[];
  valueFactorFormula: (v: number) => number;
  totalScores: number[];
  hideBeforeLast?: boolean;
}

export const ScoreboardColumnView: React.FC<ColumnViewProps> = ({ players, rounds, valueFactorFormula, totalScores, hideBeforeLast }) => {
  const visibleRounds = hideBeforeLast ? rounds.slice(-1) : rounds;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border border-gray-300 mt-4">
        <thead>
          <tr>
            <th className="border p-2 text-left">Player</th>
            {visibleRounds.map((_, rIdx) => (
              <th key={rIdx} className="border p-2 text-center">
                Round {rounds.length - visibleRounds.length + rIdx + 1}
              </th>
            ))}
            {!hideBeforeLast && (
              <th className="border p-2 text-center">Total</th>
            )}
          </tr>
        </thead>
        <tbody>
          {players.map((player, pIdx) => (
            <tr key={pIdx}>
              <td className="border p-2 font-medium">{player}</td>
              {visibleRounds.map((round, rIdx) => (
                <td
                  key={rIdx}
                  className={`border p-2 text-center ${
                    round.winner === pIdx ? "font-bold text-green-600" : ""
                  }`}
                >
                  {round.scores[pIdx].toFixed(0)} (
                  {valueFactorFormula(round.values[pIdx])},{round.points[pIdx]})
                </td>
              ))}
              {!hideBeforeLast && (
                <td className="border p-2 text-center font-semibold">
                  {totalScores[pIdx].toFixed(0)}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
