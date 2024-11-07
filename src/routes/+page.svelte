<script>
  const { data } = $props();
</script>

<svg width="800" height="400">
  {#each data.flights as datapoint}
      <circle cx={datapoint.from_long} cy={datapoint.from_lat} r="2" />
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
</style>