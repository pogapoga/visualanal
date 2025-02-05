
<script>
  import * as d3 from "d3";
  import { Chess } from 'svelte-chess';
  import Chart from "chart.js/auto";
  import { onMount } from "svelte";
  
  
  
  let winChartInstance = null;
  let ratedChartInstance = null;
  let victoryStatusChartInstance = null;
  let openings = []; // This will hold the unique openings
  let selectedOpening = ""; 
  let movesData = [];
  let chess;
  let chartInstance = null;
  let selectedMoves = [];
  let isChartVisible = false;
  let topOpenings = [];
  let timeCategoryChartInstance = null;
  let whiteRatingChartInstance = null;
  let turnsCategoryChartInstance =  null;


  function parseCSV(data) {
    const rows = data.split("\n");
    const headers = rows.shift().split(",");
    return rows
      .filter((row) => row.trim() !== "")
      .map((row) => {
        const values = row.split(",");
        return headers.reduce((acc, header, index) => {
          acc[header.trim()] = values[index].trim();
          return acc;
        }, {});
      });
  }

  function getOpeningsWithPly(data) {
    const openingsSet = new Set();
    data.forEach((game) => {
      if (game.opening_name && game.opening_ply && parseInt(game.opening_ply) <= 2) {
        openingsSet.add(game.opening_name);
      }
    });
    return Array.from(openingsSet);
  }
  
  function calculateResponses(data, moves) {
  const counts = {};

  data.forEach((game) => {
    if (game.moves) {
      const gameMoves = game.moves.split(" ");
      if (moves.length === 0) {
        const firstMove = gameMoves[0]; 
        if (firstMove) counts[firstMove] = (counts[firstMove] || 0) + 1;
      } else {
        if (moves.every((move, index) => move === gameMoves[index])) {
          const nextMove = gameMoves[moves.length];
          if (nextMove) counts[nextMove] = (counts[nextMove] || 0) + 1;
        }
      }
    }
  });

  return counts;
}
function handleOpeningSelection(openingName) {
 
resetGame();
const openingMoves = findOpeningMoves(openingName);

if (openingMoves) {
  selectedMoves.push(openingMoves[0], openingMoves[1]);

  updateChartWithSelectedMoves();
  updateChessBoard();
} else {
  console.error("Moves for the selected opening not found.");
}
}

function findOpeningMoves(openingName) {
const game = movesData.find(game => game.opening_name === openingName);
if (game && game.moves) {
  // Split the moves and return the first two
  const moves = game.moves.split(" ");
  return moves.slice(0, 2);  // Slice to only get the first two moves
}
return null;
}

function updateChartWithSelectedMoves() {

  const responses = calculateResponses(movesData, selectedMoves);

  
  updateChart("moveChart1", `Responses to ${selectedMoves.join(" ")}`, responses);

  updateWinChart("winChart1", movesData, selectedMoves);
  updateRatedChart("ratedChart", movesData, selectedMoves);
  updateVictoryStatusChart("victoryStatusChart", movesData, selectedMoves);
  updateTimeCategoryChart("timeCategoryChart", movesData, selectedMoves);
  updateWhiteRatingChart("whiteRatingChart", movesData, selectedMoves);
  updateTurnsCategoryChart("turnsCategoryChart", movesData, selectedMoves);
}


function updateChessBoard() {
  if (chess) {
    chess.reset();  
    selectedMoves.forEach(move => {
      try {
        chess.move(move);  
      } catch (error) {
        console.error("Error applying move:", move, error);
      }
    });
  }
}


  function renderChart(canvasId, label, responses) {
  const canvas = document.getElementById(canvasId);
  const ctx = canvas.getContext("2d");

  if (!chartInstance) {
    chartInstance = new Chart(ctx, {
      type: "bar",
      data: {
        labels: Object.keys(responses),
        datasets: [
          {
            label,
            data: Object.values(responses),
            backgroundColor: "rgba(75, 192, 192, 0.6)",
            borderColor: "rgba(75, 192, 192, 1)",
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: false,
        scales: {
          x: {
            ticks: {
              autoSkip: false, 
              maxRotation: 90,  
              minRotation: 45,  
            },
          },
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
            },
          },
        },
        onClick: (event) => {
  const activePoints = chartInstance.getElementsAtEventForMode(
    event,
    "nearest",
    { intersect: true },
    true
  );
  if (activePoints.length > 0) {
    const clickedMove = chartInstance.data.labels[activePoints[0].index];
    selectedMoves.push(clickedMove); // Add clicked move to the list of selected moves

    // Update all charts with new selected moves
    updateChart("moveChart1", `Responses to ${selectedMoves.join(" ")}`, calculateResponses(movesData, selectedMoves));
    updateWinChart("winChart1", movesData, selectedMoves);
    updateRatedChart("ratedChart", movesData, selectedMoves);
    updateVictoryStatusChart("victoryStatusChart", movesData, selectedMoves);
    updateTimeCategoryChart("timeCategoryChart", movesData, selectedMoves);
    updateWhiteRatingChart("whiteRatingChart", movesData, selectedMoves);
    updateTurnsCategoryChart("turnsCategoryChart", movesData, selectedMoves);
    updateChessBoard();
  }
}

      },
    });
  } else {
    chartInstance.data.labels = Object.keys(responses);
    chartInstance.data.datasets[0].data = Object.values(responses);
    chartInstance.data.datasets[0].label = label;
    chartInstance.update();
  }
}

function updateRatedChart(canvasId, gamesData, selectedMoves = []) {
  const canvas = document.getElementById(canvasId);
  const ctx = canvas.getContext("2d");

  // Calculate the rated and unrated counts based on the selected moves
  const ratedCounts = { Rated: 0, Unrated: 0 };

  // Loop through the games data and count rated/unrated games
  gamesData.forEach((game) => {
    if (game.rated) {
      const gameMoves = game.moves.split(" ");
      if (selectedMoves.every((move, index) => move === gameMoves[index])) {
        if (game.rated === "TRUE") {
          ratedCounts.Rated++;
        } else if (game.rated === "FALSE") {
          ratedCounts.Unrated++;
        }
      }
    }
  });

  // If the chart is not initialized, create a new one
  if (!ratedChartInstance) {
    ratedChartInstance = new Chart(ctx, {
      type: "pie",
      data: {
        labels: ["Rated", "Unrated"],
        datasets: [
          {
            data: [ratedCounts.Rated, ratedCounts.Unrated],
            backgroundColor: ["#3D9B9B","#E1F8F7"],
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: false,
        plugins: {
          legend: {
            display: true,
          },
        },
      },
    });
  } else {
    
    ratedChartInstance.data.datasets[0].data = [ratedCounts.Rated, ratedCounts.Unrated];
    ratedChartInstance.update();
  }
}
function updateTimeCategoryChart(canvasId, gamesData, selectedMoves = []) {
  const canvas = document.getElementById(canvasId);
  const ctx = canvas.getContext("2d");

  // Initialize counters for the categories
  const timeCategories = { Bullet: 0, Blitz: 0, Rapid: 0, Classical: 0 };

  // Loop through the games data and classify them based on time
  gamesData.forEach((game) => {
    if (game.moves) {
      const gameMoves = game.moves.split(" ");
      
      // Check if the game's moves start with the selected moves
      if (selectedMoves.every((move, index) => move === gameMoves[index])) {
        if (game.increment_code) {
          const timeParts = game.increment_code.split("+");
          const minutes = parseInt(timeParts[0]);

          // Classify based on the time (minutes)
          if (minutes <= 2) {
            timeCategories.Bullet++;
          } else if (minutes <= 5) {
            timeCategories.Blitz++;
          } else if (minutes <= 10) {
            timeCategories.Rapid++;
          } else {
            timeCategories.Classical++;
          }
        }
      }
    }
  });

  console.log("Time Categories Calculated:", timeCategories); // Debugging log

  // If the chart is not initialized, create a new one
  if (!timeCategoryChartInstance) {
    timeCategoryChartInstance = new Chart(ctx, {
      type: "pie",
      data: {
        labels: ["Bullet", "Blitz", "Rapid", "Classical"],
        datasets: [
          {
            data: [
              timeCategories.Bullet,
              timeCategories.Blitz,
              timeCategories.Rapid,
              timeCategories.Classical,
            ],
            backgroundColor: ["#E1F8F7", "#4BC0C0", "#3D9B9B", "#2A7A7A"],

            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: false,
        plugins: {
          legend: {
            display: true,
          },
        },
      },
    });
  } else {
    // If the chart is already initialized, just update it with new data
    timeCategoryChartInstance.data.datasets[0].data = [
      timeCategories.Bullet,
      timeCategories.Blitz,
      timeCategories.Rapid,
      timeCategories.Classical,
    ];
    timeCategoryChartInstance.update();
  }
}


function updateWhiteRatingChart(canvasId, gamesData, selectedMoves = []) {
  const canvas = document.getElementById(canvasId);
  const ctx = canvas.getContext("2d");

  // Initialize counters for the rating categories
  const ratingCategories = {
    LessThan1000: 0,
    From1000To1500: 0,
    From1500To2000: 0,
    MoreThan2000: 0,
  };

  // Loop through the games data and classify them based on white player rating
  gamesData.forEach((game) => {
    if (game.moves) {
      const gameMoves = game.moves.split(" ");
      
      // Check if the game's moves start with the selected moves
      if (selectedMoves.every((move, index) => move === gameMoves[index])) {
        if (game.white_rating) {
          const whiteRating = parseInt(game.white_rating);

          // Classify based on the rating
          if (whiteRating >= 1000 && whiteRating < 1500) {
            ratingCategories.From1000To1500++;
          } else if (whiteRating >= 1500 && whiteRating < 2000) {
            ratingCategories.From1500To2000++;
          } else if (whiteRating >= 2000) {
            ratingCategories.MoreThan2000++;
          }
        }
      }
    }
  });

  console.log("White Rating Categories Calculated:", ratingCategories); // Debugging log

  // If the chart is not initialized, create a new one
  if (!whiteRatingChartInstance) {
    whiteRatingChartInstance = new Chart(ctx, {
      type: "pie",
      data: {
        labels: [
          
          "elo<1500",
          "elo<2000",
          "elo>2000"
        ],
        datasets: [
          {
            data: [
              ratingCategories.LessThan1000,
              ratingCategories.From1000To1500,
              ratingCategories.From1500To2000,
              ratingCategories.MoreThan2000,
            ],
            backgroundColor: ["#E1F8F7", "#4BC0C0", "#3D9B9B", "#2A7A7A"],

            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: false,
        plugins: {
          legend: {
            display: true,
          },
        },
      },
    });
  } else {
    // If the chart is already initialized, just update it with new data
    whiteRatingChartInstance.data.datasets[0].data = [
      ratingCategories.LessThan1000,
      ratingCategories.From1000To1500,
      ratingCategories.From1500To2000,
      ratingCategories.MoreThan2000,
    ];
    whiteRatingChartInstance.update();
  }
}

function updateTurnsCategoryChart(canvasId, gamesData, selectedMoves = []) {
  const canvas = document.getElementById(canvasId);
  const ctx = canvas.getContext("2d");

  // Initialize counters for the turns categories
  const turnsCategories = { LessThan15: 0, Between15And30: 0, Between30And45: 0, MoreThan45: 0 };

  // Loop through the games data and classify them based on the number of turns
  gamesData.forEach((game) => {
    if (game.moves) {
      const gameMoves = game.moves.split(" ");

      // Check if the game's moves start with the selected moves
      if (selectedMoves.every((move, index) => move === gameMoves[index])) {
        // Use the 'turns' data directly
        const numberOfTurns = game.turns;

        // Classify based on the number of turns
        if (numberOfTurns < 15) {
          turnsCategories.LessThan15++;
        } else if (numberOfTurns >= 15 && numberOfTurns <= 30) {
          turnsCategories.Between15And30++;
        } else if (numberOfTurns > 30 && numberOfTurns <= 45) {
          turnsCategories.Between30And45++;
        } else if (numberOfTurns > 45) {
          turnsCategories.MoreThan45++;
        }
      }
    }
  });

  console.log("Turns Categories Calculated:", turnsCategories); // Debugging log

  // If the chart is not initialized, create a new one
  if (!turnsCategoryChartInstance) {
    turnsCategoryChartInstance = new Chart(ctx, {
      type: "pie",
      data: {
        labels: ["<15 Turns", "15-30 Turns", "30-45 Turns", ">45 Turns"],
        datasets: [
          {
            data: [
              turnsCategories.LessThan15,
              turnsCategories.Between15And30,
              turnsCategories.Between30And45,
              turnsCategories.MoreThan45,
            ],
            backgroundColor: ["#E1F8F7", "#4BC0C0", "#3D9B9B", "#2A7A7A"], // Adjust the colors as needed
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: false,
        plugins: {
          legend: {
            display: true,
          },
        },
      },
    });
  } else {
    // If the chart is already initialized, just update it with new data
    turnsCategoryChartInstance.data.datasets[0].data = [
      turnsCategories.LessThan15,
      turnsCategories.Between15And30,
      turnsCategories.Between30And45,
      turnsCategories.MoreThan45,
    ];
    turnsCategoryChartInstance.update();
  }
}




function updateVictoryStatusChart(canvasId, gamesData, selectedMoves) {
  const canvas = document.getElementById(canvasId);
  const ctx = canvas.getContext("2d");

  const victoryStatusCounts = { mate: 0, resign: 0, outoftime: 0, draw: 0 };

  gamesData.forEach((game) => {
    if (game.moves) {
      const gameMoves = game.moves.split(" ");
      if (selectedMoves.every((move, index) => move === gameMoves[index])) {
        if (game.victory_status === "mate") {
          victoryStatusCounts.mate++;
        } else if (game.victory_status === "resign") {
          victoryStatusCounts.resign++;
        } else if (game.victory_status === "outoftime") {
          victoryStatusCounts.outoftime++;
        } else if (game.victory_status === "draw") {
          victoryStatusCounts.draw++;
        }
      }
    }
  });
  console.log("Victory Status Counts: ", victoryStatusCounts);
  if (!victoryStatusChartInstance) {
    victoryStatusChartInstance = new Chart(ctx, {
      type: "pie",
      data: {
        labels: ["Mate", "Resign", "Out of Time", "Draw"],
        datasets: [
          {
            data: Object.values(victoryStatusCounts),
            backgroundColor: ["#FF0000", "#4BC0C0", "#E1F8F7", "#808080"],
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: false,
      maintainAspectRatio: false,  // This makes it easier to control size
      plugins: { legend: { display: true } },
      layout: { padding: 5 },
      },
    });
  } else {
    victoryStatusChartInstance.data.datasets[0].data = Object.values(victoryStatusCounts);
    victoryStatusChartInstance.update();
  }
}
  function updateChart(canvasId, label, responses) {
    console.log("Move history:", selectedMoves);

    isChartVisible = true;

    if (!chartInstance) {
      renderChart(canvasId, label, responses);
    } else {
      chartInstance.data.labels = Object.keys(responses);
      chartInstance.data.datasets[0].data = Object.values(responses);
      chartInstance.data.datasets[0].label = label;
      chartInstance.update();
    }
  }

  function resetGame() {
    if (chess) chess.reset();
    selectedMoves = [];
    const initialResponses = calculateResponses(movesData, []);
    if (chartInstance) {
        chartInstance.data.labels = Object.keys(initialResponses);
        chartInstance.data.datasets[0].data = Object.values(initialResponses);
        chartInstance.data.datasets[0].label = "Responses to starting position";
        chartInstance.update();
    } else {
        updateChart("moveChart1", "Responses to starting position", initialResponses);
    }
    updateWinChart("winChart1", movesData, []);
    updateVictoryStatusChart("victoryStatusChart", movesData, []);
    updateRatedChart("ratedChart", movesData);
    updateTimeCategoryChart("timeCategoryChart", movesData, []);
    updateTurnsCategoryChart("turnsCategoryChart", movesData, []);
    updateWhiteRatingChart("whiteRatingChart", movesData, []);
}



  function updateWinChart(canvasId, gamesData, selectedMoves) {
  const canvas = document.getElementById(canvasId);
  const ctx = canvas.getContext("2d");

  const winCounts = { white: 0, black: 0, draw: 0 };

  gamesData.forEach((game) => {
    if (game.moves) {
      const gameMoves = game.moves.split(" ");
      if (selectedMoves.every((move, index) => move === gameMoves[index])) {
        if (game.winner === "white") {
          winCounts.white++;
        } else if (game.winner === "black") {
          winCounts.black++;
        } else if (game.winner === "draw") {
          winCounts.draw++;
        }
      }
    }
  });

  if (!winChartInstance) {
    winChartInstance = new Chart(ctx, {
      type: "pie",
      data: {
        labels: ["White Wins", "Black Wins", "Draws"],
        datasets: [
          {
            data: Object.values(winCounts),
            backgroundColor: ["#D3D3D3", "#000000", "#808080"],
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: false,
        plugins: {
          legend: {
            display: true,
          },
        },
        cutoutPercentage: 70,
      },
    });
  } else {
    winChartInstance.data.datasets[0].data = Object.values(winCounts);
    winChartInstance.update();
  }
}
function getTopOpenings(data) {
    const openingCounts = {};
    data.forEach((game) => {
      const opening = game.opening_name;
      if (opening) {
        openingCounts[opening] = (openingCounts[opening] || 0) + 1;
      }
    });
  
    const sortedOpenings = Object.entries(openingCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    return sortedOpenings.map(([opening, count]) => ({ opening, count }));
  }
  

onMount(async () => {
  try {
    const response = await fetch("./games.csv");
    const csvData = await response.text();
    const data = parseCSV(csvData);
    const rawData = d3.csvParse(csvData);
    topOpenings = getTopOpenings(rawData);
    openings = getOpeningsWithPly(data);
    movesData = data;
    updateChart("moveChart1", "Responses to starting position", calculateResponses(movesData, []));
    updateWinChart("winChart1", movesData, []);
    updateRatedChart("ratedChart", movesData);
    updateVictoryStatusChart("victoryStatusChart", movesData, []);
    updateTimeCategoryChart("timeCategoryChart", movesData);
    updateWhiteRatingChart("whiteRatingChart",movesData);
    updateTurnsCategoryChart("turnsCategoryChart", movesData);

  } catch (error) {
    console.error("Error loading or processing CSV file:", error);
  }
});



  
</script>
<style>

#turnsCategoryChart{
  width: 220px; 
  height: 220px; 
} 
#timeCategoryChart{
  width: 200px; 
  height: 200px; 
} 
#whiteRatingChart{
  width: 190px; 
  height: 190px; 
} 


#victoryStatusChart {
  width: 220px; 
  height: 220px; 
}

#ratedChart {
  width: 180px;  
  height: 180px; 
}
#winChart1 {
  width: 200px;  
  height: 200px; 
}
  header {
    background-color: #f4f4f4;
    padding: 20px;
    text-align: center;
    border-bottom: 2px solid #ddd;
  }

  header h1 {
    margin: 0;
    font-size: 1.8rem;
    color: #333;
  }
  header h2 {
    margin: 0;
    font-size: 1.2rem;
    color: #666;
  }

  main {
    padding: 20px;
    max-width: 1200px;
    margin: 0 auto;
    background-color: #fff;
    border-radius: 12px;
    box-shadow: 0 0px 0px rgba(0, 0, 0, 0.1);
  }


.visualization-box {
    width: 250px;
    height: 250px;
    background-color: transparent;
    padding: 10px;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
   
}


  button {
    padding: 12px 24px;
    font-size: 16px;
    cursor: pointer;
    margin-top: 20px;
    background-color: #4BC0C0;
    color: white;
    border: none;
    border-radius: 8px;
    transition: all 0.3s ease;
  }

  button:hover {
    background-color: #3D9B9B;
    transform: scale(1.05);
  }


  .chess-container {
    flex: 1;
    max-width: 590px;
    padding: 20px;
    background-color: #f9fafb;
    border-radius: 12px;
    box-shadow: 0 0px 0px rgba(0, 0, 0, 0.1);
  }

  h1 {
    text-align: center;
    margin-bottom: 20px;
    font-size: 2rem;
    color: #2d3748;
  }

  h2 {
    text-align: center;
    margin-top: 20px;
    font-size: 1.5rem;
    color: #4A5568;
  }

 
  select {
    padding: 10px;
    font-size: 16px;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
    width: 100%;
    max-width: 400px;
    margin-top: 20px;
    background-color: #fff;
  }

  select:focus {
    outline: none;
    border-color: #56c55a;
  }

  .main-container {
    display: flex;
    align-items: flex-start;
    gap: 20px;
    position: absolute;
    left: 0px;
    top: 130px;
}

.chess-container {
    width: 600px; 
    background-color: #f9fafb;
    padding: 20px;
    border-radius: 12px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}
#victoryStatusChartContainer {
  position: absolute;
  right: 0px;
  top: 90px;
}

#winChart1Container {
  position: absolute;
  right: 0px;
  top: 320px; 
}

#ratedChartContainer {
  position: absolute;
  right: 0px;
  top: 540px;
}
#timeCategoryChartInstanceContainer {
  position: absolute;
  right: 250px;
  top: 535px;
}
#turnsCategoryChartInstanceContainer {
  position: absolute;
  right: 250px;
  top: 99px;
}
#whiteRatingChartContainer{
  position: absolute;
  right: 250px;
  top: 320px;
}
  #chart-container {
    display: block;
  }
</style>

<header>
  <h1>VISUAL ANALYTICS PROJECT SS 2025</h1>
  <h2>Chess Opening Analysis</h2>
</header>

<main>
  <div class="pie-chart-container" id="victoryStatusChartContainer">
    <div class="visualization-box">
      <canvas id="victoryStatusChart"></canvas>
    </div>
  </div>

  <div class="pie-chart-container" id="winChart1Container">
    <div class="visualization-box">
      <canvas id="winChart1"></canvas>
    </div>
  </div>

  <div class="pie-chart-container" id="ratedChartContainer">
    <div class="visualization-box">
      <canvas id="ratedChart"></canvas>
    </div>
  </div>
  <div class="pie-chart-container" id="timeCategoryChartInstanceContainer">
    <div class="visualization-box">
      <canvas id="timeCategoryChart"></canvas>
    </div>
  </div>
  <div class="pie-chart-container" id="turnsCategoryChartInstanceContainer">
    <div class="visualization-box">
      <canvas id="turnsCategoryChart"></canvas>
    </div>
  </div>
  
  
  <div class="pie-chart-container" id="whiteRatingChartContainer">
    <div class="visualization-box">
      <canvas id="whiteRatingChart"></canvas>
    </div>
  </div>
  <div class="main-container">
    <div class="chess-container">
      <Chess bind:this={chess}   />
      <button on:click={resetGame}>Reset</button>
      <button on:click={() => chess?.undo()}>Undo</button>
      <button on:click={() => chess?.toggleOrientation()}>Flip Board</button>
    </div>

    <div>
      <label for="opening-select">Select an Opening:</label>
      <select id="opening-select" bind:value={selectedOpening} on:change={() => handleOpeningSelection(selectedOpening)}>
        <option value="">Select Opening</option>
        {#each openings as opening}
          <option value={opening}>{opening}</option>
        {/each}
      </select>
      <div id="chart-container" style="display: {isChartVisible ? 'block' : 'none'};">
        <canvas id="moveChart1" width="580" height="580"></canvas>
      </div>
    </div>
  </div>
</main>