<script>
  import * as d3 from "d3";
  import { onMount } from "svelte";

  let gameCategories = [];

  onMount(async () => {
    const response = await fetch("./games.csv");
    const rawData = await response.text();
    const data = d3.csvParse(rawData);

    gameCategories = categorizeGames(data);
    drawBarChart(gameCategories);
  });

  function categorizeGames(data) {
    const categories = {
      Bullet: 0,
      Blitz: 0,
      Rapid: 0,
      Classical: 0,
    };

    data.forEach((game) => {
      const increment = game.increment_code;
      const baseMinutes = parseInt(increment.split("+")[0]);

      if (baseMinutes <= 1) {
        categories.Bullet += 1;
      } else if (baseMinutes === 5) {
        categories.Blitz += 1;
      } else if (baseMinutes === 10) {
        categories.Rapid += 1;
      } else if (baseMinutes >= 10) {
        categories.Classical += 1;
      }
    });

    return categories;
  }

  function drawBarChart(categories) {
    const margin = { top: 20, right: 30, bottom: 40, left: 100 };
    const width = 600 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    const svg = d3
      .select("#category-bar-chart")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear()
      .domain([0, d3.max(Object.values(categories))])
      .range([0, width]);

    const y = d3.scaleBand()
      .domain(Object.keys(categories))
      .range([0, height])
      .padding(0.1);

    const colorScale = d3.scaleOrdinal()
      .domain(Object.keys(categories))
      .range(["#FF6347", "#32CD32", "#FFD700", "#4682B4"]);

    const tooltip = svg.append("g")
      .attr("class", "tooltip")
      .style("visibility", "hidden");

    tooltip.append("rect")
      .attr("width", 50)
      .attr("height", 30)
      .attr("fill", "white")
      .attr("stroke", "black")
      .attr("rx", 5)
      .attr("ry", 5);

    tooltip.append("text")
      .attr("x", 5)
      .attr("y", 15)
      .style("font-size", "12px")
      .style("fill", "black");

    svg.selectAll(".bar")
      .data(Object.entries(categories))
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", 0)
      .attr("y", d => y(d[0]))
      .attr("width", d => x(d[1]))
      .attr("height", y.bandwidth())
      .attr("fill", d => colorScale(d[0]))
      .on("mouseover", function(event, d) {
        tooltip.style("visibility", "visible")
          .attr("transform", `translate(${x(d[1]) + 10}, ${y(d[0]) + y.bandwidth() / 2})`);
        tooltip.select("text").text(d[1]);
      })
      .on("mouseout", function() {
        tooltip.style("visibility", "hidden");
      });

    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x));

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
    opacity: 0.8;
  }

  .tooltip {
    pointer-events: none;
  }
</style>

<h1>Game Time Control Distribution</h1>
<div id="category-bar-chart"></div>
