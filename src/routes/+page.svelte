<script>
  import * as d3 from "d3";
  import { onMount } from "svelte";
  import { goto } from '$app/navigation'; 

  let topOpenings = [];

  onMount(async () => {
    const response = await fetch('./games.csv');
    const rawData = await response.text();
    data = d3.csvParse(rawData);

    const winnerData = countWins(data);
    drawWinnerChart(winnerData);

    topOpenings = getTopOpenings(data);
    drawOpeningChart(topOpenings);

    victoryTypes = getVictoryTypes(data);
    drawVictoryChart(victoryTypes);
  });

  function countWins(data) {
    const counts = { White: 0, Black: 0, Draw: 0 };
    data.forEach((game) => {
      if (game.winner === "white") counts.White++;
      else if (game.winner === "black") counts.Black++;
      else counts.Draw++;
    });
    return counts;
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

  function drawWinnerChart(countData) {
    const margin = { top: 40, right: 30, bottom: 60, left: 50 };
    const width = 500 - margin.left - margin.right;
    const height = 600 - margin.top - margin.bottom;

    const svg = d3
      .select("#winner-chart")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    const dataArray = Object.entries(countData).map(([key, value]) => ({
      category: key,
      value: value
    }));

    const x = d3
      .scaleBand()
      .domain(dataArray.map((d) => d.category))
      .range([0, width])
      .padding(0.1);

    const y = d3
      .scaleLinear()
      .domain([0, 20000])
      .nice()
      .range([height, 0]);

    svg
      .selectAll(".bar")
      .data(dataArray)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", (d) => x(d.category))
      .attr("y", (d) => y(d.value))
      .attr("width", x.bandwidth())
      .attr("height", (d) => height - y(d.value))
      .attr("fill", (d) => {
        if (d.category === "White") return "#FFFFFF";
        if (d.category === "Black") return "#000000";
        return "#808080";
      })
      .attr("stroke", "#000");

    svg
      .append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x).ticks(0));

    svg.append("g").call(d3.axisLeft(y).ticks(15));

    svg.append("text")
      .attr("x", width / 2)
      .attr("y", -margin.top / 2)
      .attr("text-anchor", "middle")
      .style("font-size", "20px")
      .style("font-weight", "bold")
      .text("Game Winner Counts");
  }

  

  
</script>

<style>
  .chart {
    margin: 30px 0;
    width: 100%;
  }

  .bar {
    transition: all 0.3s ease;
  }

  .bar:hover {
    opacity: 0.7;
  }

  text {
    font-size: 14px;
    fill: #333;
  }

  .axis path,
  .axis line {
    fill: none;
    shape-rendering: crispEdges;
  }

  .axis text {
    font-size: 12px;
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
<h1>Visual analytics Project</h1>
<div id="chart-container">
  <div id="winner-chart" class="chart"></div>
  <div id="opening-chart" class="chart"></div>
  <div id="victory-chart" class="chart"></div>
  

  <button on:click={() => goto('/visualanal//pie')}>Victory type Pie Chart</button>
  
  <button on:click={() => goto('/visualanal//openings')}>Top openings Bar Chart</button>
  <button on:click={() => goto('/visualanal/winner')}>Winners Donut Chart</button>
</div>
