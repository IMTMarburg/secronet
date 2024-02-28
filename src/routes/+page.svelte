<script lang="ts">
  import { base } from "$app/paths";
  import Toggler from "$lib/components/Toggler.svelte";
  export let data;
</script>

<svelte:head>
  <title>Secronet - a GRK 2573/1 website</title>
</svelte:head>
<p class="title">a GRK 2573/1 website</p>

<p>
  <Toggler klass="inline_toggler">
    <div slot="text">Help</div>
    <div class="popup">
      Secronet's data is versioned. <br />
      You can access any older version from this screen.
    </div>
  </Toggler>
</p>
<br clear="both"/>

<h2>Database version selector</h2>
{#each data.databases as database}
  <a href="{base}/{database}">{database}</a>
  <br />
{/each}
