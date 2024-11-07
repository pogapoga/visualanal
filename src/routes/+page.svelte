<script>
    const data = $props()
  </script>
  
  <ul>
    {#each data.flowers as flower}
    <li>{flower.sepalLength}</li>
    {/each}
  </ul>