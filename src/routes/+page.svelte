<script lang="ts">
  import Toggler from "$lib/components/Toggler.svelte";
  import DatasetAutoComplete from "$lib/components/DatasetAutoComplete.svelte";
  import { base } from "$app/paths";

  export let data;
  let v = JSON.parse(data.data);
  let selected;

</script>

<DatasetAutoComplete
	dataset="secretome/olink/TCell_Anna_Steitz/"
	column="Assay"
	bind:selected={selected}
	prefix="false"


	/>


{selected}

