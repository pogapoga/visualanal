<script>
  import * as d3 from "d3";
  import { onMount } from "svelte";

  let winnerData = []; 

  onMount(async () => {
    const response = await fetch('./games.csv');
    const rawData = await response.text();
    const parsedData = d3.csvParse(rawData);

  
    winnerData = getWinnerCounts(parsedData);


    drawDonutChart(winnerData);
  });


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

  
  function drawDonutChart(data) {
    const width = 250;
    const height = 250;
    const margin = 50;
    const radius = Math.min(width, height) / 2 - margin;

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

    const hoverArc = d3
      .arc()
      .innerRadius(radius * 0.5)
      .outerRadius(radius + 10); 

    const arcs = svg.selectAll("arc").data(pie(data)).enter().append("g");

    arcs
      .append("path")
      .attr("d", arc)
      .attr("fill", (d) => color(d.data.category))
      .attr("stroke", "black")
      .style("stroke-width", "2px")
      .on("mouseover", function (event, d) {
        d3.select(this).transition().duration(200).attr("d", hoverArc);
      })
      .on("mouseout", function (event, d) {
        d3.select(this).transition().duration(200).attr("d", arc);
      });

    arcs
      .append("text")
      .attr("transform", (d) => `translate(${arc.centroid(d)})`)
      .attr("text-anchor", "middle")
      .style("font-size", "14px")
      .style("fill", (d) => (d.data.category === "Black" ? "white" : "black"))
      .text((d) => `${d.data.category}: ${d.data.count}`);
  }
</script>

<style>
  /* Make the chart smaller and adjust its position */
  #donut-chart {
    width: 250px; /* Set a smaller width for the donut chart */
    height: 250px; /* Set a smaller height for the donut chart */
    margin: 0 auto; /* Center the chart horizontally */
  }

  /* Make the heading text smaller and position it under the donut chart */
  h1 {
    font-size: 14px; /* Smaller text size */
    text-align: center; /* Center the text */
    margin-top: 10px; /* Add space between the chart and the text */
  }
</style>



<div id="donut-chart"></div>
