<script>
    import { onMount } from "svelte";
    import * as d3 from "d3";
  
    let chartContainer;
  
    onMount(async () => {
      const width = 800; 
      const height = 600; 
      const margin = { top: 20, right: 50, bottom: 60, left: 60 };
  
    
      const data = await d3.csv("/games.csv", d => ({
        white_rating: +d.white_rating, 
        moves: +d.turns 
      }));
  
      const svg = d3
        .select(chartContainer)
        .append("svg")
        .attr("width", width)
        .attr("height", height);
  
   
      const xScale = d3
        .scaleLinear()
        .domain([
          d3.min(data, d => d.white_rating) - 50,
          d3.max(data, d => d.white_rating) + 50
        ])
        .range([margin.left, width - margin.right]);
  
      const yScale = d3
        .scaleLinear()
        .domain([
          d3.min(data, d => d.moves) - 5,
          d3.max(data, d => d.moves) + 5
        ])
        .range([height - margin.bottom, margin.top]);
  
      const xAxis = g =>
        g
          .attr("transform", `translate(0,${height - margin.bottom})`)
          .call(d3.axisBottom(xScale).ticks(10))
          .call(g =>
            g
              .append("text")
              .attr("x", width - margin.right)
              .attr("y", 40)
              .attr("fill", "black")
              .attr("text-anchor", "end")
              .text("White Rating")
          );
  
      const yAxis = g =>
        g
          .attr("transform", `translate(${margin.left},0)`)
          .call(d3.axisLeft(yScale).ticks(10))
          .call(g =>
            g
              .append("text")
              .attr("x", -50)
              .attr("y", margin.top)
              .attr("fill", "black")
              .attr("text-anchor", "end")
              .attr("transform", "rotate(-90)")
              .text("Number of Moves")
          );
  
      svg.append("g").call(xAxis);
      svg.append("g").call(yAxis);
  
      svg
        .append("g")
        .selectAll("circle")
        .data(data)
        .join("circle")
        .attr("cx", d => xScale(d.white_rating))
        .attr("cy", d => yScale(d.moves))
        .attr("r", 0.75)
        .attr("fill", "blue");
    });
  </script>
  <h1>Moves to rating graph</h1>
  <div bind:this={chartContainer}></div>
  <h2>We see a trend where games last longer the higher rated the games get</h2>