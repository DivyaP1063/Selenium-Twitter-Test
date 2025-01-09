import React, { useState } from "react";

const App = () => {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [queryloading, setqueryLoading] = useState(false);

  const handleRunScript = async () => {
    setLoading(true);
    try {
      await fetch("http://localhost:5000/run-script");
      const response = await fetch("http://localhost:5000/get-results");
      const data = await response.json();
      setResult(data[0]);
    } catch (error) {
      console.error("Error:", error);
    }
    setLoading(false);
  };

  const handleQuery = async () => {
    setqueryLoading(true);
    try {
      const response = await fetch("http://localhost:5000/get-results");
      const data = await response.json();
      setResult(data[0]);
    } catch (error) {
      console.error("Error:", error);
    }
    setqueryLoading(false);
  };

  // Function to group trends in sets of 3 lines with a trendingX label
  const groupTrends = (trendText) => {
    const parts = trendText.split("\n").filter((item) => item.trim() !== "");
    let groupedTrends = [];
    let trendingCount = 1;

    for (let i = 1; i < parts.length; i += 3) {
      // Group the current set of three lines
      const group = parts.slice(i, i + 3).join("\n");
      groupedTrends.push(`trending${trendingCount}-\n${group}`);
      trendingCount++;
    }

    return groupedTrends;
  };

  return (
    <div className="p-7 flex flex-col gap-y-4">
      <h1 className="text-lg font-bold">Trending Topics</h1>
      <button
        onClick={handleRunScript}
        disabled={loading}
        className="w-fit h-hit"
      >
        {loading ? "Running..." : "Click here to run the script"}
      </button>
      {result && (
        <div>
          <p>These are the most happening topics as on {result.dateTime}</p>
          <div>
            {result.trends.map((trend, index) => (
              <div key={index}>
                {groupTrends(trend).map((groupedTrend, i) => (
                  <div key={i} className={`${i == 5 && "hidden"} flex gap-2`}>
                    <strong>{groupedTrend.split("\n")[0]}</strong>
                    <p>{groupedTrend.split("\n").slice(1).join("\n")}</p>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <p>The IP address used for this query was {result.ipAddress}.</p>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
      <button
        onClick={handleQuery}
        disabled={queryloading}
        className="w-fit h-hit"
      >
        {queryloading ? "Running..." : "Click here to run query again"}
      </button>
    </div>
  );
};

export default App;
