import React from 'react'

interface ChildProps {
  score: string;
  valueFactor: number;
  Points: number;
  showDetails:boolean;
};
//{sc ore.toFixed(0)} ({valueFactorFormula(round.values[idx])}, {round.points[idx]})
const ScoreTile: React.FC<ChildProps> = ({
    score, valueFactor, Points,showDetails
}) => {
  return (
    <>
      {showDetails ? (
        <div className="flex flex-col justify-center items-center text-center space-y-1">
          <div className="flex items-center gap-1">
            <span className="block md:hidden uppercase truncate">V:</span>
            <span className="hidden md:block">Value:</span>
            <span>{valueFactor}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="block md:hidden uppercase truncate">P:</span>
            <span className="hidden md:block">Point:</span>
            <span>{Points}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="block md:hidden uppercase truncate">S:</span>
            <span className="hidden md:block">Score:</span>
            <span>{score}</span>
          </div>
        </div>
      ) : (
        <div className="flex justify-center items-center h-full text-center">
          {score}
        </div>
      )}
    </>
  );
}

export default ScoreTile