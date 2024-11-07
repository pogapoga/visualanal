<h1>Flights from Germany</h1>

<script>
    import { base } from '$app/paths';
    import { onMount } from 'svelte';
    import { scaleLinear } from 'd3-scale';

    let flights = [];

    onMount(async () => {
        const response = await fetch(base + "/flights_part.json");
        const allFlights = await response.json();
        // Filter for flights originating from Germany
        flights = allFlights.filter(flight => flight.from_country === "Germany");
    });

    // Scaling values for zoomed-out view
    const scaleX = scaleLinear().domain([-180, 180]).range([0, 800]);
    const scaleY = scaleLinear().domain([-90, 90]).range([400, 0]);
    const scaleColour = scaleLinear().domain([-180, 180]).range(["brown", "green"]);
    const scaleRadius = scaleLinear().domain([1, 15406]).range([2, 10]);

    const lineYOffset = 45; 
    const lineXOffset = -26; // Amount to move lines down and to the left
</script>

<svg width="800" height="400">
    <!-- Overlay the world map image -->
    <image href="/world_map.png" x="0" y="0" width="800" height="400" opacity="0.5" />

    {#each flights as datapoint}
        <!-- Thinner line representing the flight path with downward and leftward offset -->
        <line x1={scaleX(datapoint.from_long) + lineXOffset}
              y1={scaleY(datapoint.from_lat) + lineYOffset}
              x2={scaleX(datapoint.to_long) + lineXOffset}
              y2={scaleY(datapoint.to_lat) + lineYOffset}
              style="stroke:blue; stroke-width:0.3; opacity:0.65"/>

        <!-- Circle at the destination of the flight, applying the same offsets -->
        <circle cx={scaleX(datapoint.to_long) + lineXOffset}
                cy={scaleY(datapoint.to_lat) + lineYOffset}
                r={scaleRadius(datapoint.distance)}            
                style={"fill:" + scaleColour(datapoint.to_long)}
                class:international={datapoint.from_country != datapoint.to_country}/>
    {/each}
</svg>

<style>
    svg {
        border: 0.1px solid;
    }
    circle {
        fill-opacity: 0.5;
    }
    circle.international {
        fill: red !important;
    }
</style>
