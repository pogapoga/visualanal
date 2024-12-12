<script>
  import { goto } from '$app/navigation'; 
  import { onMount } from "svelte";
  import Chart from "chart.js/auto";

  let movesData = [];
  let selectedMove = "";
  let moveCounts = {};
  let chartInstance;

  
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

  
  function calculateMoveFrequencies(data, whiteMove) {
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

 
  function updateChart(whiteMove) {
    if (chartInstance) {
      chartInstance.destroy();
    }


    const blackResponses = calculateMoveFrequencies(movesData, whiteMove);

    const canvas = document.getElementById("moveChart");
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
      },
    });
  }


  onMount(async () => {
    try {
      const response = await fetch("/games.csv"); 
      const csvData = await response.text();
      movesData = parseCSV(csvData);
    } catch (error) {
      console.error("Error loading CSV file:", error);
    }
  });
</script>

<style>
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
</style>

<h1>Visual analytics Project</h1>
<div id="chart-container">
  <button on:click={() => goto('/visualanal/pie')}>Victory type Pie Chart</button>
  <button on:click={() => goto('/visualanal/openings')}>Top openings Bar Chart</button>
  <button on:click={() => goto('/visualanal/winner')}>Winners Donut Chart</button>
</div>

<main>
  <h1>Chess Moves Analysis</h1>
  <div>
    <label for="moves">Select White's first move:</label>
    <select id="moves" bind:value={selectedMove} on:change={() => updateChart(selectedMove)}>
      <option value="" disabled selected>Select a move</option>
      {#if possibleWhiteMoves.length > 0}
        {#each possibleWhiteMoves as move}
          <option value={move}>{move}</option>
        {/each}
      {/if}
    </select>
  </div>

  {#if selectedMove}
    <canvas id="moveChart" width="400" height="200"></canvas>
  {/if}
</main>
