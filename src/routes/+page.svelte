<script lang="ts">
  import { base } from "$app/paths";
    export let data;

</script>

<svelte:head>
  <title>Secronet - a GRK 2573/1 website</title>
</svelte:head>
<p class="title">a GRK 2573/1 website</p>

<h2>Database version selector</h2>
{#each data.databases as database}
	  <a href="{base}/{database}">{database}</a>
	  <br />
{/each}
