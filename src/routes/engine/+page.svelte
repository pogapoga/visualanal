<script>
  import Chess, { Engine } from 'svelte-chess';
  // Note: stockfish.js must be manually downloaded (see Readme)
</script>
<Chess engine={new Engine({depth: 20, moveTime: 1500, color: 'w'})} />