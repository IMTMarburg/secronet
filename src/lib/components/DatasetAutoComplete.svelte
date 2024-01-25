<script lang="ts">
  import { base } from "$app/paths";
  import AutoComplete from "simple-svelte-autocomplete";

  export let selected;
  export let dataset;
  export let database_version;
  export let column;
  export let prefix = false;
  export let autofocus = null;

  async function getItems(searchTerm) {
    const url =
      base +
      "/" +
      database_version +
      "/autocomplete/?query=" +
      encodeURIComponent(searchTerm) +
      "&database_version=" +
      encodeURIComponent(database_version) +
      "&dataset=" +
      encodeURIComponent(dataset) +
      "&prefix=" +
      encodeURIComponent(prefix) +
      "&column=" +
      encodeURIComponent(column);
    const response = await fetch(url);
    const json = await response.json();
    return json;
  }
</script>

<AutoComplete
  searchFunction={getItems}
  delay="200"
  bind:selectedItem={selected}
  localFiltering={false}
  {autofocus}
  cleanUserText={false}
  inputClassName="dsa-input"
/>
