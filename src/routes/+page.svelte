<script>
  const data = $props()
  <h1>hello</h1>
</script>

<ul>
  {#each data.flowers as flower}
  <li>{flower.sepalLength}</li>
  {/each}
</ul>