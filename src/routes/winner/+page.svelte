<script>
    import * as d3 from "d3";
    import { onMount } from "svelte";
    import { goto } from '$app/navigation'; 
    
    let winnerData = []; // Processed data for the chart
  
    onMount(async () => {
      // Load the CSV data
      const response = await fetch('./games.csv');
      const rawData = await response.text();
      const parsedData = d3.csvParse(rawData);
  
      // Process the data to count winners
      winnerData = getWinnerCounts(parsedData);
  
      // Draw the chart
      drawDonutChart(winnerData);
    });
  
    // Function to calculate winner counts
    function getWinnerCounts(data) {
      const counts = { White: 0, Black: 0, Draw: 0 };
      data.forEach((game) => {
        if (game.winner === "white") counts.White++;
        else if (game.winner === "black") counts.Black++;
        else if (game.winner === "draw") counts.Draw++;
      });
  
      return Object.entries(counts).map(([category, count]) => ({
        category,
        count,
      }));
    }
  
    // Function to draw the donut chart
    function drawDonutChart(data) {
      const width = 400;
      const height = 400;
      const margin = 50;
      const radius = Math.min(width, height) / 2 - margin;
      const labelArc = d3
  .arc()
  .innerRadius(radius * 0.7) 
  .outerRadius(radius * 3.0);
  
      d3.select("#donut-chart").selectAll("*").remove();
  
      const svg = d3
        .select("#donut-chart")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${width / 2}, ${height / 2})`);
  
      const color = d3
        .scaleOrdinal()
        .domain(data.map((d) => d.category))
        .range(["#FFFFFF", "#000000", "#808080"]); 
  
      const pie = d3
        .pie()
        .value((d) => d.count)
        .sort(null);
  
      const arc = d3
        .arc()
        .innerRadius(radius * 0.5) 
        .outerRadius(radius);
  
      const arcs = svg.selectAll("arc").data(pie(data)).enter().append("g");
  
      arcs
        .append("path")
        .attr("d", arc)
        .attr("fill", (d) => color(d.data.category))
        .attr("stroke", "black")
        .style("stroke-width", "2px");
  
   
      arcs
        .append("text")
        .attr("transform", (d) => `translate(${arc.centroid(d)})`)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .text((d) => `${d.data.category}: ${d.data.count}`);
    }
  </script>
   <style>
    .chart-container {
      display: flex;
      justify-content: center;
      align-items: center;
      margin: 20px;
      flex-direction: column;
    }
  
    button {
      margin-top: 20px;
      padding: 10px 20px;
      font-size: 16px;
      background-color: #4682B4;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      transition: background-color 0.3s;
    }
  
    button:hover {
      background-color: #355f73;
    }
  </style>
  
  <div class="chart-container">
    <div id="donut-chart"></div>
    <button on:click={() => goto('/')}>Back</button>
  </div>
  