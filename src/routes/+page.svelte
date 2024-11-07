<script>
  import { scaleLinear } from 'd3-scale';

  const { data } = $props();

  const scaleX = scaleLinear().domain([-180,180]).range([0,800])
  const scaleY = scaleLinear().domain([-90,90]).range([400,0])
  const scaleRadius = scaleLinear().domain([1,15406]).range([2,10])
  </script>

<svg width="800" height="400">
  {#each data.flights as datapoint}
    <circle cx={scaleX(datapoint.from_long)}
        cy={scaleY(datapoint.from_lat)}
        r={scaleRadius(datapoint.distance)}
        class:international={datapoint.from_country != datapoint.to_country}/>
  {/each}
</svg>

<style>
  svg {
    border: 1px;
    border-style: solid;
  }
  circle {
    fill: steelblue;
    fill-opacity: 0.5;
  }
  circle.international {
    fill: red;
  }
</style>