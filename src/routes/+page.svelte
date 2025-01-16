<script>
  import { Chess } from 'svelte-chess';
  import Chart from "chart.js/auto";
  import { onMount } from "svelte";
  import VictoryTypePiechart from './pie/+page.svelte';
  import OpeningBarchart from './openings/+page.svelte';
  import WinnerDonutChart from './winner/+page.svelte';
  import TimeChart from './time/+page.svelte'

  let movesData = [];
  let moveHistory = [];
  let chartInstances = {};
  let chess;

  const possibleWhiteMoves = [
    "e4", "d4", "Nf3", "c4", "e3", "g3", "f4", "b3", "a3", 
    "h3", "Nc3", "Nf3", "Nh3", "b4", "d3", "f3", "g4", "Nf3",
    "c3",
  ];

  function parseCSV(data) {
    const rows = data.split("\n");
    const headers = rows.shift().split(",");
    return rows
      .filter(row => row.trim() !== "") 
      .map(row => {
        const values = row.split(",");
        return headers.reduce((acc, header, index) => {
          acc[header] = values[index];
          return acc;
        }, {});
      });
  }

  function calculateMoveResponses(data, moves, targetIndex) {
    const counts = {};
    data.forEach(game => {
      if (game.moves) {
        const gameMoves = game.moves.split(" ");
        if (moves.every((move, index) => move === gameMoves[index]) && gameMoves[targetIndex]) {
          const responseMove = gameMoves[targetIndex];
          counts[responseMove] = (counts[responseMove] || 0) + 1;
        }
      }
    });
    return counts;
  }

  function renderChart(canvasId, label, responses, onClickHandler) {
    const canvas = document.getElementById(canvasId);
    
    const ctx = canvas.getContext("2d");

    if (chartInstances[canvasId]) {
      chartInstances[canvasId].destroy();
    }

    chartInstances[canvasId] = new Chart(ctx, {
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
          y: {
            beginAtZero: true,
          },
        },
        onClick: (event) => {
          const activePoints = chartInstances[canvasId].getElementsAtEventForMode(
            event,
            'nearest',
            { intersect: true },
            true
          );
          if (activePoints.length > 0) {
            const clickedMove = Object.keys(responses)[activePoints[0].index];
            onClickHandler(clickedMove);
          }
        },
      },
    });
  }

  function updateChart(moves, canvasId, label, targetIndex, onClickHandler) {
    if (chess) {
      try {
        chess.move(moves[moves.length - 1]);
        moveHistory.push(moves[moves.length - 1]);
      } catch (error) {
        console.error("Invalid move:", error);
      }
    }

    const responses = calculateMoveResponses(movesData, moves, targetIndex);
    renderChart(canvasId, label, responses, onClickHandler);
  }

  function resetGame() {
    if (chess) chess.reset();
    moveHistory = [];
    Object.values(chartInstances).forEach(instance => instance.destroy());
    chartInstances = {};
  }

  onMount(async () => {
    try {
      const response = await fetch("./games.csv");
      const csvData = await response.text();
      movesData = parseCSV(csvData);
    } catch (error) {
      console.error("Error loading CSV file:", error);
    }
  });
</script>

<style>
  #chart-container {
    max-width: 600px;
    margin: 20px;
    padding: 10px;
    border: 1px solid #ccc;
    background-color: #fff;
    border-radius: 10px;
  }

  canvas {
    width: 100%;
    height: auto; 
    max-height: 300px; 
    max-width: 100%; 
    display: block; 
    margin: 0 auto; 
  }

  button {
    padding: 10px 20px;
    font-size: 16px;
    cursor: pointer;
    margin-top: 20px;
    background-color: #4682B4;
    color: white;
    border: none;
    border-radius: 5px;
    transition: background-color 0.3s;
  }

  button:hover {
    background-color: #355f73;
  }

  .main-container {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 20px;
  }

  .chess-container {
    flex: 1;
    max-width: 512px;
  }

  .chart-container {
    flex: 1;
    max-width: 600px;
  }

  .visualizations-container {
    display: flex;
    justify-content: space-between; 
    gap: 20px; 
    background-color: #f5f5f5; 
    padding: 20px; 
    border-radius: 10px; 
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); 
    margin-bottom: 20px; 
  }

  .visualization-box {
    background-color: #fff; 
    padding: 15px;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); 
    flex: 1; 
    min-width: 250px; 
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    overflow: hidden; 
  }

  .barchart-container {
    background-color: #f5f5f5; 
    padding: 20px;
    border-radius: 10px; 
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); 
  }

  h1 {
    text-align: center;
    margin-bottom: 20px;
  }

  h2 {
    text-align: center;
    margin-top: 20px;
  }
</style>

<main>
  <h1>Visual Analytics Project</h1>

  
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
  <h2>Winner side</h2>

  <div class="main-container">
    <div class="chess-container">
      <Chess bind:this={chess} />
      <button on:click={resetGame}>Reset</button>
      <button on:click={() => chess?.undo()}>Undo</button>
      <button on:click={() => chess?.makeEngineMove()}>Make Best Move</button>
    </div>

    <div class="chart-container">
      <div style="max-width: 512px;">
        <label for="moves">Select White's first move:</label>
        <select
          id="moves"
          on:change={(e) =>
            updateChart([e.target.value], "moveChart1", `Black's responses to ${e.target.value}`, 1, (clickedMove) => {
              updateChart([e.target.value, clickedMove], "moveChart2", `White's responses to ${clickedMove}`, 2, (clickedMove2) => {
                updateChart([e.target.value, clickedMove, clickedMove2], "moveChart3", `Black's responses to ${clickedMove2}`, 3, () => {});
              });
            })
          }
        >
          <option value="" disabled selected>Select a move</option>
          {#each possibleWhiteMoves as move}
            <option value={move}>{move}</option>
          {/each}
        </select>
      </div>

      <div id="chart-container">
        <canvas id="moveChart1" width="400" height="200"></canvas>
        <canvas id="moveChart2" width="400" height="200"></canvas>
        <canvas id="moveChart3" width="400" height="200"></canvas>
      </div>
    </div>
  </div>
</main>

