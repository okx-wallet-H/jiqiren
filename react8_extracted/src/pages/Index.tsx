import { useState } from "react";
import StrategyDetail from "./StrategyDetail";
import LeaderboardPage from "./LeaderboardPage";

type PageView = "detail" | "leaderboard";

const Index = () => {
  const [currentPage, setCurrentPage] = useState<PageView>("detail");

  console.log("Current page:", currentPage);

  if (currentPage === "leaderboard") {
    return (
      <LeaderboardPage
        onBack={() => setCurrentPage("detail")}
      />
    );
  }

  return (
    <StrategyDetail
      onNavigateToLeaderboard={() => setCurrentPage("leaderboard")}
      onBack={() => console.log("back")}
    />
  );
};

export default Index;
