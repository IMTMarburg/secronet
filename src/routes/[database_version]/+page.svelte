<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from "svelte";
  import Toggler from "$lib/components/Toggler.svelte";
  import MetaTable from "$lib/components/MetaTable.svelte";
  import { browser } from "$app/environment";
  import { useTooltip } from "@untemps/svelte-use-tooltip";

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

  function picker_chosen(ev) {
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
    for (let dataset of data.datasets) {
      filtered[dataset.name] = filter_dataset(dataset.name, meta);
    }
    filtered = filtered;
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

<p>
  <Toggler klass="inline_toggler">
    <div slot="text">Help</div>
    <div class="popup">
      In this view you can either pick a single dataset to examine, <br /> or
      examine multiple datasets with the "cross Dataset view' link at the
      bottom.<br />
      <br />
      To quickly find datasets of interest, use the filter buttons.
    </div>
  </Toggler>
</p>
<br clear="both" />

<h2>{data.database_version} - Dataset selector</h2>
<b style="float:left;">Filter: &nbsp;</b>
{#each Object.entries(get_tag_values()) as values, tag}
  <Picker items={values[1]} name={values[0]} on:chosen={picker_chosen} />
{/each}
<br style="clear:both" />
<br style="clear:both" />

{#each data.datasets as dataset, idx}
  {#if !filtered[dataset.name]}
    <template id="meta_{idx}">
	<div style="red;">
	<MetaTable meta={dataset.meta} header=""/>
	</div>
    </template>
    <span><b>{dataset.name}
	:</b>
    <a
      href="{base}/{data.database_version}/info/{dataset.name.replaceAll(
        '/',
        ':::'
      )}">Description</a
    >
    /
    <a
      href="{base}/{data.database_version}/jitter/{dataset.name.replaceAll(
        '/',
        ':::'
      )}">Jitter</a
    >
	</span>
    <br />
  {/if}
{/each}

<hr />
<a href="{base}/{data.database_version}/cross_dataset">Cross Dataset view</a>
<br />
<a href="{base}/{data.database_version}/download">Download</a>
<style>

 :global(.tooltip) {
        position: absolute;
        z-index: 9999;
        background-color: #FFFFFF;
        text-align: center;
        border-radius: 6px;
        padding: 0.5rem;
    }

    :global(.tooltip::after) {
        content: '';
        position: absolute;
        margin-left: -5px;
        border-width: 5px;
        border-style: solid;
    }

    :global(.tooltip-right::after) {
        top: calc(50% - 5px);
        left: -5px;
        border-color: transparent #ee7008 transparent transparent;
    }

    :global(.tooltip-enter) {
        animation: fadeIn 0.2s linear forwards;
    }
</style>


