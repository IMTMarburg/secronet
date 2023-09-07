<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from "svelte";
  import { browser } from "$app/environment";

  import Toggler from "$lib/components/Toggler.svelte";

  import DatasetAutoComplete from "$lib/components/DatasetAutoComplete.svelte";
  import Picker from "$lib/components/Picker.svelte";
  import { base } from "$app/paths";

  export let data;

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
</script>

<svelte:head>
  <title>Secronet - a GRK 2573/1 website</title>
</svelte:head>
<p class="title">a GRK 2573/1 website</p>

<h2>Dataset selector</h2>
<h3>Filter</h3>
{#each Object.entries(get_tag_values()) as values, tag}
  <Picker items={values[1]} name={values[0]} />
  <br />
{/each}

{#each data.datasets as dataset}
  <b>{dataset.name}</b>:
  <a href="info/{dataset.name.replaceAll('/', ':::')}">Description</a>
  /
  <a href="jitter/{dataset.name.replaceAll('/', ':::')}">Jitter</a>
  <br />
{/each}
