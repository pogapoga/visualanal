<script>
  import { base } from '$app/paths';
  import { onMount } from 'svelte';
  import { scaleLinear } from 'd3-scale';

  let flights = [];

  onMount(async () => {
      const response = await fetch(base + "/flights_part.json");
      const allFlights = await response.json();
      flights = allFlights;
  });

  const scaleX = scaleLinear().domain([-180, 180]).range([0, 800]);
  const scaleY = scaleLinear().domain([-90, 90]).range([400, 0]);
  const scaleRadius = scaleLinear().domain([1, 15406]).range([2, 10]);

  const lineYOffset = 38;
  const lineXOffset = -22;

  
</script>
<h1 class="title">All Airports and All Flights Originating from India</h1>

<svg width="800" height="400" class="flight-map">
    {#each flights as datapoint}
        {#if datapoint.from_country === "India"}
            <line x1={scaleX(datapoint.from_long) + lineXOffset}
                  y1={scaleY(datapoint.from_lat) + lineYOffset}
                  x2={scaleX(datapoint.to_long) + lineXOffset}
                  y2={scaleY(datapoint.to_lat) + lineYOffset}
                  style="stroke:red; stroke-width:0.5; opacity:0.7" />
        {/if}

        <circle cx={scaleX(datapoint.from_long) + lineXOffset}
                cy={scaleY(datapoint.from_lat) + lineYOffset}
                r=2
                fill="blue" />

        <circle cx={scaleX(datapoint.to_long) + lineXOffset}
                cy={scaleY(datapoint.to_lat) + lineYOffset}
                r=2
                fill="blue" />
    {/each}
</svg>

<style>
    .title {
        text-align: center;
        font-size: 2rem;
        color: #333;
        margin-bottom: 20px;
        font-weight: bold;
        text-transform: uppercase;
    }

    svg {
        border: 2px solid #ccc;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        margin: 0 auto;
        display: block;
    }

    .flight-map {
        max-width: 100%;
        height: auto;
    }
    
</style>