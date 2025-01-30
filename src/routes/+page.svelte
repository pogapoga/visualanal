
<script>
  import * as d3 from "d3";
  import { Chess } from 'svelte-chess';
  import Chart from "chart.js/auto";
  import { onMount } from "svelte";
  import VictoryTypePiechart from './pie/+page.svelte';
  import TimeChart from './time/+page.svelte';
  
  let winChartInstance = null;
  let victoryStatusChartInstance = null;
  let movesData = [];
  let chess;
  let chartInstance = null;
  let selectedMoves = [];
  let selectedStartMove = "";
  let isChartVisible = false;
  let topOpenings = [];

  const possibleWhiteMoves = [
    "e4", "d4", "Nf3", "c4", "e3", "g3", "f4", "b3", "a3", 
    "h3", "Nc3", "Nf3", "Nh3", "b4", "d3", "f3", "g4", "Nf3",
    "c3",
  ];

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

  
  function calculateResponses(data, moves) {
    const counts = {};
    data.forEach((game) => {
      if (game.moves) {
        const gameMoves = game.moves.split(" ");
        if (moves.every((move, index) => move === gameMoves[index])) {
          const nextMove = gameMoves[moves.length];
          if (nextMove) {
            counts[nextMove] = (counts[nextMove] || 0) + 1;
          }
        }
      }
    });
    return counts;
  }

  function updateChessBoard() {
    if (chess) {
      chess.reset(); 
      selectedMoves.forEach(move => {
        try {
          chess.move(move); 
        } catch (error) {
          console.error("Invalid move:", move, error);
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
        scales: {
          y: { beginAtZero: true },
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
            selectedMoves.push(clickedMove);
            // Update both the bar chart and pie chart when a bar is clicked
            updateChart("moveChart1", `Responses to ${selectedMoves.join(" ")}`, calculateResponses(movesData, selectedMoves));
            updateWinChart("winChart1", movesData, selectedMoves); // Add this line to update the pie chart
            console.log("Updating victory status chart...");
            updateVictoryStatusChart("victoryStatusChart", movesData, selectedMoves);
            updateChessBoard(); // Update the chessboard
          }
        },
      },
    });
  } else {
    chartInstance.data.labels = Object.keys(responses);
    chartInstance.data.datasets[0].data = Object.values(responses);
    chartInstance.data.datasets[0].label = label;
    chartInstance.update();
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
  // Update or create the pie chart for victory status
  if (!victoryStatusChartInstance) {
    victoryStatusChartInstance = new Chart(ctx, {
      type: "pie",
      data: {
        labels: ["Mate", "Resign", "Out of Time", "Draw"],
        datasets: [
          {
            data: Object.values(victoryStatusCounts),
            backgroundColor: ["#FF6347", "#FFD700", "#008080", "#808080"],
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: false,
          },
        },
        cutoutPercentage: 70,
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
    if (chartInstance) {
      chartInstance.destroy();
      chartInstance = null; 
    }
    if (winChartInstance) {
    winChartInstance.destroy();
    winChartInstance = null; 
  }
  if (victoryStatusChartInstance) {
    victoryStatusChartInstance.destroy();
    victoryStatusChartInstance = null; 
  }
    updateChart("moveChart1", "Responses to starting position");
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
        responsive: true,
        plugins: {
          legend: {
            display: false,
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
  function drawOpeningChart(topOpenings) {
  const margin = { top: 40, right: 30, bottom: 60, left: 50 };
  const width = 500 - margin.left - margin.right;
  const height = 300 - margin.top - margin.bottom;

  const svg = d3
    .select("#opening-chart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  const x = d3
    .scaleBand()
    .domain(topOpenings.map((d) => d.opening))
    .range([0, width])
    .padding(0.1);

  const y = d3
    .scaleLinear()
    .domain([0, d3.max(topOpenings, (d) => d.count)])
    .nice()
    .range([height, 0]);

  const tooltip = d3
    .select("body")
    .append("div")
    .style("position", "absolute")
    .style("background-color", "#fff")
    .style("border", "1px solid #ccc")
    .style("border-radius", "5px")
    .style("padding", "10px")
    .style("display", "none")
    .style("box-shadow", "0 4px 8px rgba(0, 0, 0, 0.2)");

  const openingFens = {
    "Van't Kruijs Opening": "rnbqkbnr/pppppppp/8/8/8/4P3/PPPP1PPP/RNBQKBNR b KQkq - 0 1",  
    "Sicilian Defense": "rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq c6 0 2",  
    "Sicilian Defense: Bowdler Attack": "rnbqkbnr/pp1ppppp/8/2p5/2B1P3/8/PPPP1PPP/RNBQK1NR b KQkq - 1 2", 
    "French Defense: Knight Variation": "rnbqkbnr/pppp1ppp/4p3/8/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2",
    "Scotch Game": "rnbqkbnr/pppp1ppp/8/4p3/3PP3/8/PPP2PPP/RNBQKBNR b KQkq d3 0 2", 
  };

  svg
    .selectAll(".bar")
    .data(topOpenings)
    .enter()
    .append("rect")
    .attr("class", "bar")
    .attr("x", (d) => x(d.opening))
    .attr("y", (d) => y(d.count))
    .attr("width", x.bandwidth())
    .attr("height", (d) => height - y(d.count))
    .attr("fill", "#4682B4")
    .on("mouseover", (event, d) => {
      tooltip
        .style("display", "block")
        .html(`<strong>${d.opening}</strong><br>Count: ${d.count}`);
      d3.select(event.currentTarget).attr("fill", "#355f73");
    })
    .on("mousemove", (event) => {
      tooltip
        .style("left", `${event.pageX + 10}px`)
        .style("top", `${event.pageY - 20}px`);
    })
    .on("mouseout", (event) => {
      tooltip.style("display", "none");
      d3.select(event.currentTarget).attr("fill", "#4682B4");
    })
    .on("click", (event, d) => {
      const fen = openingFens[d.opening];
      if (fen) {
        console.log("Loading FEN:", fen);
        chess.load(fen); 
      } else {
        console.error("No FEN found for this opening!");
      }
    });

  svg
    .append("g")
    .attr("transform", `translate(0, ${height})`)
    .call(d3.axisBottom(x));

  svg.append("g").call(d3.axisLeft(y).ticks(5));
}

onMount(async () => {
  try {
    const response = await fetch("./games.csv");
    const csvData = await response.text();
    const data = parseCSV(csvData);
    const rawData = d3.csvParse(csvData);
    topOpenings = getTopOpenings(rawData);
    drawOpeningChart(topOpenings);
    movesData = data;
    updateChart("moveChart1", "Responses to starting position");
  } catch (error) {
    console.error("Error loading or processing CSV file:", error);
  }
});



  
</script>
<style>


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

  .chart {
    margin: 30px 0;
    width: 100%;
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

  
  .visualizations-container {
    position: absolute;
    margin-top: 0px;
    top: 80px; 
    left: 0px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    background-color: transparent; 
  }
  .visualization-box {
    width: 250px; 
    height: 250px; 
    margin-top: 45px;
    background-color:transparent;
    padding: 0px 0; 
    border-radius: 8px; 
    box-shadow: none; 
    display: flex;
    justify-content: left;
    align-items: left;
    overflow: hidden; 
  }


  button {
    padding: 12px 24px;
    font-size: 16px;
    cursor: pointer;
    margin-top: 20px;
    background-color: #4CAF50;
    color: white;
    border: none;
    border-radius: 8px;
    transition: all 0.3s ease;
  }

  button:hover {
    background-color: #45a049;
    transform: scale(1.05);
  }


  .chess-container {
    flex: 1;
    max-width: 500px;
    padding: 20px;
    background-color: #f9fafb;
    border-radius: 12px;
    box-shadow: 0 0px 0px rgba(0, 0, 0, 0.1);
  }

  .winner-line {
    position: absolute; 
    top: 610px; 
    left: 50px;
    font-size: 20px; 
    color: #000000; 
    font-family: Arial, sans-serif; 
  }
  .pie-line {
    position: absolute; 
    top: 300px; 
    left: 30px;
    font-size: 20px; 
    color: #000000; 
    font-family: Arial, sans-serif; 
  }
  .chart-container {
    background-color: transparent;
    padding: 0; 
    margin: 0;
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


  .hoverable-container {
    width: 400px; 
    height: 250px; 
    background-color: transparent; 
    border-radius: 8px; 
    box-shadow: 0 0px 0px rgba(0, 0, 0, 0.1); 
    transition: all 0.3s ease; 
    position: absolute;
    right: 120px; 
    top: 80px;
    padding: 10px;
  }

  .hoverable-container-two {
    width: 400px; 
    height: 250px; 
    background-color: transparent; 
    border-radius: 8px; 
    box-shadow: 0 0px 0 rgba(0, 0, 0, 0.1); 
    transition: all 0.3s ease; 
    position: absolute;
    right: 170px; 
    top: 380px; 
    padding: 10px;
  }


.main-container {
    display: flex; 
    gap: 20px; 
  }

  
  .chess-container {
    width: 2%; 
    background-color: #f9fafb;
    padding: 20px;
    border-radius: 12px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }

  .chart-container {
    width: 35%; 
    background-color: transparent;
    padding: 20px;
    border-radius: 12px;
    box-shadow: 0 0px 0px rgba(0, 0, 0, 0.1);
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
  <div class="visualizations-container">
    <div class="visualization-box">
      <canvas id="victoryStatusChart"></canvas>
      <p class="pie-line">Victory type Pie Chart</p>
    </div>

    <div class="visualization-box">
      <div class="chart-containertwo">
        <canvas id="winChart1"></canvas>
      </div>
      <p class="winner-line">Winners by Color</p>
    </div>
  </div>

  <div class="hoverable-container">
    
<div id="opening-chart" class="chart"></div>
  </div>

  <div class="hoverable-container-two">
    <TimeChart />
  </div>

  <div class="main-container">
    <div class="chess-container">
      <Chess bind:this={chess} />
      <button on:click={resetGame}>Reset</button>
      <button on:click={() => chess?.undo()}>Undo</button>
    </div>

    <div class="chart-container">
      <div style="max-width: 512px;">
        <label for="moves">Select White's first move:</label>
        <select
          id="moves"
          bind:value={selectedStartMove}
          on:change={() => {
            if (selectedStartMove) {
              selectedMoves = [selectedStartMove];
              const responses = calculateResponses(movesData, selectedMoves);
              renderChart("moveChart1", `Responses to ${selectedStartMove}`, responses);
              updateWinChart("winChart1", movesData, selectedMoves); // Update winner pie chart
            }
          }}
        >
          <option value="" disabled selected>Select a move</option>
          {#each possibleWhiteMoves as move}
            <option value={move}>{move}</option>
          {/each}
        </select>
      </div>

      <div id="chart-container" style="display: {isChartVisible ? 'block' : 'none'};">
        <canvas id="moveChart1" width="200" height="200"></canvas>
      </div>
    </div>
  </div>
</main>