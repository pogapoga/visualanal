<script>
  import { goto } from '$app/navigation';
  import { onMount } from "svelte";
  import Chart from "chart.js/auto";
  import { Chess } from 'svelte-chess';
  
  
  

  let movesData = [];
  let selectedWhiteMove = "";
  let selectedBlackMove = "";
  let moveHistory = [];  
  let chartInstance;
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

 
  function calculateBlackResponses(data, whiteMove) {
    const counts = {};
    data.forEach(game => {
      if (game.moves) {
        const moves = game.moves.split(" ");
        if (moves[0] === whiteMove && moves[1]) {
          const blackMove = moves[1];
          counts[blackMove] = (counts[blackMove] || 0) + 1;
        }
      }
    });
    return counts;
  }

  
  function calculateWhiteResponses(data, whiteMove, blackMove) {
    const counts = {};
    data.forEach(game => {
      if (game.moves) {
        const moves = game.moves.split(" ");
        if (moves[0] === whiteMove && moves[1] === blackMove && moves[2]) {
          const whiteMoveResponse = moves[2];
          counts[whiteMoveResponse] = (counts[whiteMoveResponse] || 0) + 1;
        }
      }
    });
    return counts;
  }


  function updateBlackResponsesChart(whiteMove) {
  
    if (chess) {
      try {
        chess.move(whiteMove);
        moveHistory.push(whiteMove); 
        selectedWhiteMove = whiteMove;  
      } catch (error) {
        console.error("Invalid move:", error);
      }
    }

 
    if (chartInstance) {
      chartInstance.destroy();
    }

    const blackResponses = calculateBlackResponses(movesData, whiteMove);

    const canvas = document.getElementById("moveChart1");
    if (!canvas) {
      console.error("Canvas element not found");
      return;
    }

    const ctx = canvas.getContext("2d");
    chartInstance = new Chart(ctx, {
      type: "bar",
      data: {
        labels: Object.keys(blackResponses),
        datasets: [
          {
            label: `Black's responses to ${whiteMove}`,
            data: Object.values(blackResponses),
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
          
          const activePoints = chartInstance.getElementsAtEventForMode(event, 'nearest', { intersect: true }, true);
          if (activePoints.length > 0) {
            const clickedBlackMove = Object.keys(blackResponses)[activePoints[0].index];  
            updateWhiteResponsesChart(selectedWhiteMove, clickedBlackMove);  
          }
        },
      },
    });
  }

 
  function updateWhiteResponsesChart(whiteMove, blackMove) {
    if (chess) {
      
      try {
        chess.move(blackMove);
        moveHistory.push(blackMove);  
        selectedBlackMove = blackMove;  
      } catch (error) {
        console.error("Invalid move:", error);
      }
    }

    
    const whiteResponses = calculateWhiteResponses(movesData, whiteMove, blackMove);

    const canvas = document.getElementById("moveChart2");
    if (!canvas) {
      console.error("Canvas element not found");
      return;
    }

    const ctx = canvas.getContext("2d");
    chartInstance = new Chart(ctx, {
      type: "bar",
      data: {
        labels: Object.keys(whiteResponses),
        datasets: [
          {
            label: `White's responses to Black's ${blackMove}`,
            data: Object.values(whiteResponses),
            backgroundColor: "rgba(153, 102, 255, 0.6)",
            borderColor: "rgba(153, 102, 255, 1)",
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
          const activePoints = chartInstance.getElementsAtEventForMode(event, 'nearest', { intersect: true }, true);
          if (activePoints.length > 0) {
            const clickedWhiteMove = Object.keys(whiteResponses)[activePoints[0].index];  
            updateChessBoard(clickedWhiteMove);  
          }
        },
      },
    });
  }

  function updateChessBoard(move) {
    if (chess) {
      try {
        const moveResult = chess.move(move);
        moveHistory.push(moveResult.san); 
      } catch (error) {
        console.error("Invalid move:", error);
      }
    }
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
    max-width: 100%;
    height: auto;
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

  h1 {
    text-align: center;
  }
</style>

<main>
  <h1>Visual Analytics Project</h1>
  <h2>Chess Moves Analysis</h2>

  <div class="main-container">
   
    <div class="chess-container">
      
      <Chess bind:this={chess}/>
      <button on:click={() => { 
        chess?.reset(); 
        moveHistory = []; 
        selectedWhiteMove = ""; 
        selectedBlackMove = ""; 
        updateBlackResponsesChart(selectedWhiteMove); 
      }}>Reset</button>
      <button on:click={()=>chess?.undo()}>Undo</button>
      <button on:click={()=>chess?.makeEngineMove()}>Make Best Move</button>
      
    </div>

    <!-- Chart container -->
    <div class="chart-container">
      {#if selectedWhiteMove}
        <div id="chart-container">
          <canvas id="moveChart1" width="400" height="200"></canvas>
        </div>
      {/if}

      <div style="max-width: 512px;">
        <label for="moves">Select White's first move:</label>
        <select id="moves" bind:value={selectedWhiteMove} on:change={() => updateBlackResponsesChart(selectedWhiteMove)}>
          <option value="" disabled selected>Select a move</option>
          {#each possibleWhiteMoves as move}
            <option value={move}>{move}</option>
          {/each}
        </select>
      </div>

      {#if selectedBlackMove}
        <!-- Second chart for White's responses -->
        <div id="chart-container">
          <canvas id="moveChart2" width="400" height="200"></canvas>
        </div>
      {/if}
    </div>
  </div>

  <div id="chart-container">
    <button on:click={() => goto('/visualanal/pie')}>Victory type Pie Chart</button>
    <button on:click={() => goto('/visualanal/openings')}>Top openings Bar Chart</button>
    <button on:click={() => goto('/visualanal/winner')}>Winners Donut Chart</button>
  </div>
</main>
