<script>
    import Chart from "chart.js/auto";
    import { onMount } from "svelte";
  
    let movesData = []; // Stores the dataset of chess games
    let selectedMoves = []; // Tracks the sequence of selected moves
    let chartInstance = null; // Stores the chart instance
  
    // Parse CSV data into an array of objects
    function parseCSV(data) {
      const rows = data.split("\n");
      const headers = rows.shift().split(",");
      return rows
        .filter(row => row.trim() !== "")
        .map(row => {
          const values = row.split(",");
          return headers.reduce((acc, header, index) => {
            acc[header.trim()] = values[index]?.trim();
            return acc;
          }, {});
        });
    }
  
    // Calculate responses to the selected moves
    function calculateResponses(data, moves) {
      const counts = {};
      data.forEach(game => {
        if (game.moves) {
          const gameMoves = game.moves.split(" ");
          // Check if the game's moves match the selected sequence
          if (moves.every((move, index) => move === gameMoves[index])) {
            const nextMove = gameMoves[moves.length]; // Get the next move
            if (nextMove) {
              counts[nextMove] = (counts[nextMove] || 0) + 1;
            }
          }
        }
      });
      return counts;
    }
  
    // Render or update the chart
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
                console.log("Clicked move:", clickedMove);
                selectedMoves.push(clickedMove); // Add the clicked move to the sequence
                updateChart(canvasId, `Responses to ${selectedMoves.join(" ")}`);
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
  
    // Update the chart based on the selected moves
    function updateChart(canvasId, label) {
      const responses = calculateResponses(movesData, selectedMoves);
      renderChart(canvasId, label, responses);
    }
  
    // Reset the game and chart
    function resetGame() {
      selectedMoves = []; // Clear the selected moves
      if (chartInstance) {
        chartInstance.destroy();
        chartInstance = null;
      }
      updateChart("chartCanvas", "Responses to starting position");
    }
  
    // Load the CSV data on mount
    onMount(async () => {
      try {
        const response = await fetch("./games.csv");
        const csvData = await response.text();
        movesData = parseCSV(csvData);
        updateChart("chartCanvas", "Responses to starting position");
      } catch (error) {
        console.error("Error loading CSV file:", error);
      }
    });
  </script>
  
  <canvas id="chartCanvas"></canvas>
  <button on:click={resetGame}>Reset Game</button>
  