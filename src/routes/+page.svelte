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

    const lineYOffset = 40;
    const lineXOffset = -30; // Amount to move lines down and to the left

    // Function to calculate a simple control point for the curve
    function getControlPoint(x1, y1, x2, y2) {
        // Simple control point in the middle of the line to create a curve
        return [(x1 + x2) / 2, (y1 + y2) / 2 - 50]; // Adjust `-50` for more/less curvature
    }
</script>

<svg width="800" height="400">
    <!-- Overlay the world map image -->
    <image href="/world_map.png" x="0" y="0" width="800" height="400" opacity="0.5" />

    {#each flights as datapoint}
        <!-- Curved line using a quadratic Bezier curve -->
        <path d="
            M {scaleX(datapoint.from_long) + lineXOffset} {scaleY(datapoint.from_lat) + lineYOffset} 
            Q {getControlPoint(scaleX(datapoint.from_long) + lineXOffset, scaleY(datapoint.from_lat) + lineYOffset, scaleX(datapoint.to_long) + lineXOffset, scaleY(datapoint.to_lat) + lineYOffset)[0]} 
            {getControlPoint(scaleX(datapoint.from_long) + lineXOffset, scaleY(datapoint.from_lat) + lineYOffset, scaleX(datapoint.to_long) + lineXOffset, scaleY(datapoint.to_lat) + lineYOffset)[1]} 
            {scaleX(datapoint.to_long) + lineXOffset} {scaleY(datapoint.to_lat) + lineYOffset}" 
            style="stroke:blue; stroke-width:0.3; fill:none; opacity:0.7"/>

        <!-- Circle at the destination of the flight, applying the same offsets -->
        <circle cx={scaleX(datapoint.to_long) + lineXOffset}
                cy={scaleY(datapoint.to_lat) + lineYOffset}
                r={scaleRadius(datapoint.distance) / 2}  <!-- Smaller circles -->
                style={"fill:" + scaleColour(datapoint.to_long)}
                class:international={datapoint.from_country != datapoint.to_country}/>
    {each}
<svg>

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
