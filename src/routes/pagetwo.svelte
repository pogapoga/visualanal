<!-- src/routes/pagetwo.svelte -->
<script>
    import { goto } from '@sveltejs/kit';

    function navigateToPageOne() {
        goto('/');  // This navigates to the homepage
    }
</script>

<h1 class="title">Page Two</h1>
<p>This is Page Two content.</p>

<div class="buttons">
    <button on:click={navigateToPageOne}>Go to Page One</button>
</div>

<style>
    .title {
        text-align: center;
        font-size: 2rem;
        color: #333;
        margin-bottom: 20px;
        font-weight: bold;
        text-transform: uppercase;
    }

    .buttons {
        text-align: center;
        margin-top: 20px;
    }

    button {
        padding: 10px 20px;
        font-size: 1rem;
        background-color: #007bff;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        transition: background-color 0.3s;
    }

    button:hover {
        background-color: #0056b3;
    }
</style>