<script>
  import { Chess } from 'svelte-chess';
  import Chart from "chart.js/auto";
  import { onMount } from "svelte";
  import VictoryTypePiechart from './pie/+page.svelte';
  import OpeningBarchart from './openings/+page.svelte';
  import WinnerDonutChart from './winner/+page.svelte';
  import TimeChart from './time/+page.svelte';
  import Scatter from './scatter/+page.svelte';

  let movesData = [];
  let moveHistory = [];
  let chess;
  let chartInstance = null;
  let selectedMoves = []; // Tracks the sequence of selected moves
  let selectedStartMove = "";
  let isChartVisible = false;

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
    chess.reset(); // Reset the board to the initial position
    selectedMoves.forEach(move => {
      try {
        chess.move(move); // Apply each move in the sequence
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
            selectedMoves.push(clickedMove); // Add the clicked move to the sequence
            updateChart("moveChart1", `Responses to ${selectedMoves.join(" ")}`, calculateResponses(movesData, selectedMoves));
            updateChessBoard(); // Update the chessboard to reflect the selected moves
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

function updateChart(canvasId, label, responses) {
  console.log("Move history:", selectedMoves); // Debugging

  // Show the chart once it's updated with data
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
    selectedMoves = []; // Reset the selected moves
    if (chartInstance) {
      chartInstance.destroy();
      chartInstance = null; // Reset the chart instance
    }
    updateChart("moveChart1", "Responses to starting position");
  }

  onMount(async () => {
    try {
      const response = await fetch("./games.csv");
      const csvData = await response.text();
      movesData = parseCSV(csvData);
      updateChart("moveChart1", "Responses to starting position");
    } catch (error) {
      console.error("Error loading CSV file:", error);
    }
  });
</script>


<style>
  body {
    margin: 0;
    padding: 0;
    background: linear-gradient(to bottom, #4A90E2, #4682B4); /* Blue gradient background */
    min-height: 100vh; 
    font-family: 'Arial', sans-serif; 
  }

  
  main {
    padding: 20px;
    max-width: 1200px;
    margin: 0 auto;
    background-color: #fff; 
    border-radius: 12px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
  
  #chart-container {
    max-width: 600px;
    margin: 20px;
    padding: 20px;
    border-radius: 12px;
    background-color: #fff;
    border: 1px solid #e5e7eb; /* Lighter border color */
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  canvas {
    width: 100%;
    height: auto;
    max-height: 300px;
    max-width: 100%;
    display: block;
    margin: 0 auto;
  }

  /* Button styles */
  button {
    padding: 12px 24px;
    font-size: 16px;
    cursor: pointer;
    margin-top: 20px;
    background-color: #4CAF50; /* Greenish color */
    color: white;
    border: none;
    border-radius: 8px;
    transition: all 0.3s ease;
  }

  button:hover {
    background-color: #45a049; /* Slightly darker green */
    transform: scale(1.05); /* Slight scaling effect */
  }

  /* Layout styling for the main container */
  .main-container {
    display: flex;
    flex-wrap: wrap; /* Makes it responsive */
    justify-content: space-between;
    align-items: flex-start;
    gap: 20px;
  }

  /* Chess container with shadow and margin */
  .chess-container {
    flex: 1;
    max-width: 512px;
    padding: 20px;
    background-color: #f9fafb;
    border-radius: 12px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }

  /* Chart container styling */
  .chart-container {
    flex: 1;
    max-width: 600px;
    padding: 20px;
    background-color: #f9fafb;
    border-radius: 12px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }

  /* Section for visualizations with spacing and soft shadows */
  .visualizations-container {
    display: flex;
    justify-content: space-between;
    gap: 20px;
    background-color: #f9fafb;
    padding: 20px;
    border-radius: 12px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    margin-bottom: 20px;
  }

  /* Individual visualization boxes with soft borders */
  .visualization-box {
    background-color: #fff;
    padding: 20px;
    border-radius: 10px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    flex: 1;
    min-width: 250px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    text-align: center;
  }

  /* Bar chart container style */
  .barchart-container {
    background-color: #f9fafb;
    padding: 20px;
    border-radius: 12px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }

  /* Heading styles */
  h1 {
    text-align: center;
    margin-bottom: 20px;
    font-size: 2rem; /* Larger font size */
    color: #2d3748; /* Darker shade of text */
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
</style>

<main>

  <div class="bg-gradient-to-r from-blue-500 to-teal-400 text-white p-4 rounded-lg">
    <h1>Welcome to my SvelteKit app!</h1>
  </div>


  <h1>Visual Analytics Project</h1>

  <div class="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4 rounded-lg">
    Your content looks better now!
  </div>

 
  <button class="btn btn-primary">Click Me</button>


  <div class="visualizations-container">
    <div class="visualization-box">
      <VictoryTypePiechart />
    </div>
    <div class="visualization-box">
      <WinnerDonutChart />
    </div>
  </div>

  
  <div class="barchart-container">
    <OpeningBarchart />
  </div>

  <div class="barchart-container">
    <TimeChart />
  </div>

  <Scatter />

  
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
      selectedMoves = [selectedStartMove]; // Start with the selected move
      const responses = calculateResponses(movesData, selectedMoves);
      renderChart("moveChart1", `Responses to ${selectedStartMove}`, responses);
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
        <canvas id="moveChart1" width="400" height="200"></canvas>
        
      </div>
      
    </div>
  </div>
</main>
