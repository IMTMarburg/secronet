<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from "svelte";
  import { browser } from "$app/environment";

  import { base } from "$app/paths";
  export let data;

</script>

<svelte:head>
  <title>Secronet - a GRK 2573/1 website</title>
</svelte:head>
<p class="title">a GRK 2573/1 website</p>

<p>
	Download compressed archive of this version below. 
</p>
<p>
	For each dataset, you will receive three files
</p>
	<ul>
		<li> meta.json - A JSON formated file with the metadata for this dataset.</li>
		<li> df.parquet - The data table for the dataset in the modern parquet format. 
		Prefer this, if your downstream software supports it, since it retains data types.
</li>
		<li> df.tsv - The data table as 'tab separated values'. Might be readable in Excel. 
		</li>
	</ul>

<a href="{base}/{data.database_version}/download/get">
	<input type="submit" value="Download" />
</a>
