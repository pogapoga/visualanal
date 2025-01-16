<script>
    import * as d3 from "d3";
    import { onMount } from "svelte";
    import { goto } from '$app/navigation'; 
  
    let victoryTypes = [];
  
    onMount(async () => {
      const response = await fetch("./games.csv");
      const rawData = await response.text();
      const data = d3.csvParse(rawData);
  
      victoryTypes = getVictoryTypes(data);
  
      drawVictoryPieChart(victoryTypes);
    });
  
    function getVictoryTypes(data) {
      const victoryCounts = {};
      data.forEach((game) => {
        const victory = game.victory_status;
        if (victory) {
          victoryCounts[victory] = (victoryCounts[victory] || 0) + 1;
        }
      });
      return Object.entries(victoryCounts).map(([victory, count]) => ({ victory, count }));
    }
  
    function drawVictoryPieChart(victoryTypes) {
      const width = 500;
      const height = 500;
      const radius = Math.min(width, height) / 2;
  
      const color = d3
        .scaleOrdinal()
        .domain(victoryTypes.map((d) => d.victory))
        .range(d3.schemeCategory10);
  
      const svg = d3
        .select("#victory-pie-chart")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${width / 2}, ${height / 2})`);
  
      const pie = d3.pie().value((d) => d.count);
      const arc = d3
        .arc()
        .innerRadius(0)
        .outerRadius(radius);
  
      const arcs = svg
        .selectAll("arc")
        .data(pie(victoryTypes))
        .enter()
        .append("g")
        .attr("class", "arc");
  
      arcs
        .append("path")
        .attr("d", arc)
        .attr("fill", (d) => color(d.data.victory));
  
      arcs
        .append("text")
        .attr("transform", (d) => `translate(${arc.centroid(d)})`)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .text((d) =>
          `${d.data.victory}: ${(
            (d.data.count / d3.sum(victoryTypes, (d) => d.count)) *
            100
          ).toFixed(1)}%`
        );
    }
  </script>
  
  <style>
    svg {
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
  </style>
  

  <h1>Victory Types Pie Chart</h1>
  <div id="victory-pie-chart">
    

  </div>
  