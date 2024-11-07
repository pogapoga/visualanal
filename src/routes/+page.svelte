<h1>Welcome to SvelteKit</h1>

<script>
    import { base } from '$app/paths';
    import { onMount } from 'svelte';
    import { scaleLinear } from 'd3-scale';

    let flights = [];

    onMount(async () => {
        const response = await fetch(base + "/flights_part.json");
        const allFlights = await response.json();
        // Filter for flights between India and Germany
        flights = allFlights.filter(flight => 
            (flight.from_country === "India" && flight.to_country === "Germany") ||
            (flight.from_country === "Germany" && flight.to_country === "India")
        );
    });

    // Scaling values
    const scaleX = scaleLinear().domain([-180, 180]).range([0, 800]);
    const scaleY = scaleLinear().domain([-90, 90]).range([400, 0]);
    const scaleColour = scaleLinear().domain([-180, 180]).range(["brown", "green"]);
    const scaleRadius = scaleLinear().domain([1, 15406]).range([2, 10]);

</script>

<svg width="800" height="400">
    {#each flights as datapoint}
        <circle cx={scaleX(datapoint.from_long)}
            cy={scaleY(datapoint.from_lat)}
            r={scaleRadius(datapoint.distance)}
            style={"fill:" + scaleColour(datapoint.from_long)}
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
