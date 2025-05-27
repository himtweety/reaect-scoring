// ScoreboardRowView.tsx
import React from "react";

interface RoundData {
  values: number[];
  points: number[];
  scores: number[];
  winner: number;
  totalValueFactor: number;
}

interface RowViewProps {
  players: string[];
  rounds: RoundData[];
  valueFactorFormula: (v: number) => number;
  totalScores: number[];
}

export const ScoreboardRowView: React.FC<RowViewProps> = ({ players, rounds, valueFactorFormula, totalScores }) => {
  return (
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
              {rIdx + 1} ({round.totalValueFactor.toFixed(0)})
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
  );
};

