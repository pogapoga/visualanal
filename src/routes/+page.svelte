

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

    // Adjusted scaling values for zoomed-in view
    const scaleX = scaleLinear().domain([-30, 60]).range([0, 800]);
    const scaleY = scaleLinear().domain([-10, 70]).range([400, 0]);
    const scaleColour = scaleLinear().domain([-30, 60]).range(["brown", "green"]);
    const scaleRadius = scaleLinear().domain([1, 15406]).range([2, 10]);

</script>

<svg width="800" height="400">
    {#each flights as datapoint}
        <!-- Draw line representing the flight path -->
        <line x1={scaleX(datapoint.from_long)}
              y1={scaleY(datapoint.from_lat)}
              x2={scaleX(datapoint.to_long)}
              y2={scaleY(datapoint.to_lat)}
              style="stroke:blue; stroke-width:1; opacity:0.5"/>

        <!-- Draw circle at the destination of the flight -->
        <circle cx={scaleX(datapoint.to_long)}
                cy={scaleY(datapoint.to_lat)}
                r={scaleRadius(datapoint.distance)}            
                style={"fill:" + scaleColour(datapoint.to_long)}
                class:international={datapoint.from_country != datapoint.to_country}/>
    {/each}
</svg>

<style>
    svg {
        border: 1px solid;
    }
    circle {
        fill-opacity: 0.5;
    }
    circle.international {
        fill: red !important;
    }
</style>
