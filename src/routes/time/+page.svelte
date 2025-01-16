<script>
  import * as d3 from "d3";
  import { onMount } from "svelte";

  let incrementCounts = [];

  onMount(async () => {
    const response = await fetch("./games.csv");
    const rawData = await response.text();
    const data = d3.csvParse(rawData);

    incrementCounts = getFilteredIncrementCounts(data, ["1", "3", "5", "10", "30"]);
    drawIncrementBarChart(incrementCounts);
  });

  function getFilteredIncrementCounts(data, baseTimes) {
    const counts = {};

    
    data.forEach(game => {
      const increment = game.increment_code;
      const baseMinutes = increment.split("+")[0]; 

      if (baseTimes.includes(baseMinutes)) {
       
        if (!counts[baseMinutes]) {
          counts[baseMinutes] = 0;
        }

        counts[baseMinutes] += 1;
      }
    });

    return Object.entries(counts).map(([baseMinutes, count]) => ({
      baseMinutes,
      count
    }));
  }

  function drawIncrementBarChart(incrementCounts) {
    const margin = { top: 20, right: 30, bottom: 40, left: 40 };
    const width = 600 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const x = d3.scaleBand()
      .domain(incrementCounts.map(d => d.baseMinutes)) 
      .range([0, width])
      .padding(0.1);

    const y = d3.scaleLinear()
      .domain([0, d3.max(incrementCounts, d => d.count)])
      .nice()
      .range([height, 0]);

    const svg = d3.select("#increment-bar-chart")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    svg.selectAll(".bar")
      .data(incrementCounts)
      .enter().append("rect")
      .attr("class", "bar")
      .attr("x", d => x(d.baseMinutes))
      .attr("y", d => y(d.count))
      .attr("width", x.bandwidth())
      .attr("height", d => height - y(d.count))
      .attr("fill", "#4682B4");

   
    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .style("font-size", "12px")
      .style("text-anchor", "middle");

    svg.append("g")
      .call(d3.axisLeft(y));
  }
</script>

<style>
  svg {
    display: block;
    margin: 0 auto;
  }

  .bar {
    transition: all 0.3s ease;
  }

  .bar:hover {
    fill: #355f73;
  }
</style>

<h1>Game Time Control (Increment Code) Bar Chart</h1>
<div id="increment-bar-chart"></div>
