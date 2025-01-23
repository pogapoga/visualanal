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

  
  .visualizations-container {
    position: absolute;
    top: 80px; 
    left: 0px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    background-color: transparent; 
  }
  .visualization-box {
    width: 400px; 
    height: 250px; 
    background-color: transparent;
    padding: 0; 
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
    top: 500px; 
    left: 30px;
    font-size: 20px; 
    color: #000000; 
    font-family: Arial, sans-serif; 
  }
  .pie-line {
    position: absolute; 
    top: 190px; 
    left: 30px;
    font-size: 20px; 
    color: #000000; 
    font-family: Arial, sans-serif; 
  }
  .chart-container {
    background-color: transparent; /* Make chart container transparent */
    padding: 0; /* No padding */
    margin: 0; /* No margin */
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
  .visualization-box:hover {
    transform: scale(1.2);
    transition: transform 0.8s ease; 
  }


  .visualization-box:hover .chart-container {
    transform: scale(1.2); 
    transition: transform 0.8s ease;
  }
  .hoverable-container {
    width: 400px; 
    height: 250px; 
    background-color: transparent; 
    border-radius: 8px; 
    box-shadow: 0 0px 0px rgba(0, 0, 0, 0.1); 
    transition: all 0.3s ease; 
    position: absolute;
    right: 40px; 
    top: 80px;
    padding: 10px;
  }

  .hoverable-container:hover {
    width: 500px; 
    height: 300px; 
    box-shadow: 0 0px rgba(0, 0, 0, 0.2); /* Larger shadow on hover */
  }
  .hoverable-container-two {
    width: 400px; 
    height: 250px; 
    background-color: transparent; 
    border-radius: 8px; 
    box-shadow: 0 0px 0 rgba(0, 0, 0, 0.1); 
    transition: all 0.3s ease; 
    position: absolute;
    right: 10px; 
    top: 380px; 
    padding: 10px;
  }

  .hoverable-container-two:hover {
    width: 500px; 
    height: 300px; 
    box-shadow: 0 0x 0px rgba(0, 0, 0, 0.2);
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
    box-shadow: 0 8px 8px rgba(0, 0, 0, 0.1);
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
      
     
        <VictoryTypePiechart />
      
      <p class="pie-line">Victory type Pie Chart</p>
    </div>
    <div class="visualization-box">
      <div class="chart-container">
       
        <WinnerDonutChart />
      </div>
      
    </div>
    <p class="winner-line">Winners by color</p>
  </div>

  <div class="hoverable-container">
    <OpeningBarchart />
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
