<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from "svelte";
  import { browser } from "$app/environment";

  import Toggler from "$lib/components/Toggler.svelte";

  import DatasetAutoComplete from "$lib/components/DatasetAutoComplete.svelte";
  import { base } from "$app/paths";

  export let data;

</script>

<h2>Dataset selector</h2>

<ul>
	{#each data.datasets as dataset}
		<li><a href="jitter?dataset={dataset.name}">{dataset.name}</a></li>
	{/each}
</ul>
