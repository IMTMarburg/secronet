<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from "svelte";
  import { browser } from "$app/environment";

  import Toggler from "$lib/components/Toggler.svelte";

  import DatasetAutoComplete from "$lib/components/DatasetAutoComplete.svelte";
  import Picker from "$lib/components/Picker.svelte";
  import { base } from "$app/paths";

  export let data;
  let filters = {};
  let filtered = {};

  for (let dataset of data.datasets) {
	  filtered[dataset.name] = false;
  }

  function get_tag_values() {
    let res = {};
    for (let tag of data.meta_tags) {
      if (!res[tag.tag]) {
        res[tag.tag] = [];
      }
      if (!res[tag.tag].includes(tag.value)) {
        res[tag.tag].push(tag.value);
      }
    }
    return res;
  }

  function picker_chosen(ev){
	  //alert(JSON.stringify(ev.detail));
	  if (ev.detail.value != "") {
		  filters[ev.detail.name] = ev.detail.value;
	  } else {
		  if (filters[ev.detail.name]) {
			  delete filters[ev.detail.name];
		  }
	  }
	  update_filtered();
  }

  function update_filtered() {
	let meta = data.meta_tags;
	console.log(filters);
	for (let dataset of data.datasets) {
		filtered[dataset.name] = filter_dataset(dataset.name, meta);
	}
	filtered  = filtered;
	console.log(filtered);
  }

  function filter_dataset(dataset_name, meta) {
	let fc = 0;
	for (let tag of meta) {
		if (tag.dataset == dataset_name) {
			if (filters[tag.tag] && filters[tag.tag] == tag.value) {
				fc += 1;
			}
		}
	}
	return !(fc == Object.keys(filters).length); 
  }
</script>

<svelte:head>
  <title>Secronet - a GRK 2573/1 website</title>
</svelte:head>
<p class="title">a GRK 2573/1 website</p>

<h2>Dataset selector</h2>
<b style="float:left;">Filter: &nbsp;</b>
{#each Object.entries(get_tag_values()) as values, tag}
	<Picker items={values[1]} name={values[0]} on:chosen={picker_chosen} />
{/each}
<br style="clear:both" />
<br style="clear:both" />

{#each data.datasets as dataset}
	{#if !filtered[dataset.name]}
	  <b>{dataset.name}</b>:
	  <a href="{base}/info/{dataset.name.replaceAll('/', ':::')}">Description</a>
	  /
	  <a href="{base}/jitter/{dataset.name.replaceAll('/', ':::')}">Jitter</a>
	  <br />
	{/if}
{/each}
