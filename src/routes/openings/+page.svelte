
<script>
  import * as d3 from "d3";
  import { onMount } from "svelte";
  import { goto } from '$app/navigation'; 
  
  let data = []; 
  let topOpenings = [];
  
  onMount(async () => {
    try {
      const response = await fetch('./games.csv');
      const rawData = await response.text();
      data = d3.csvParse(rawData);
  
      topOpenings = getTopOpenings(data);
      drawOpeningChart(topOpenings);
    } catch (error) {
      console.error("Error loading or processing CSV data:", error);
    }
  });
  
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
    const width = 900 - margin.left - margin.right;
    const height = 600 - margin.top - margin.bottom;
  
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
      ;
  
    svg
      .append("g")
      .attr("transform", `translate(0, ${height})`)
      .call(d3.axisBottom(x));
  
    svg.append("g").call(d3.axisLeft(y).ticks(5));
  
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", -margin.top / 2)
      .attr("text-anchor", "middle")
      .style("font-size", "20px")
      .style("font-weight", "bold")
      .text("Top 5 Chess Openings");
  }
</script>

<style>
  .chart {
    margin: 30px 0;
    width: 100%;
  }

  .bar {
    transition: all 0.3s ease;
    cursor: pointer;
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

<h1>Top 5 Chess Openings</h1>
<div id="opening-chart" class="chart"></div>
