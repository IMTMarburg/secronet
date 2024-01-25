<script lang="ts">
  import { clickoutside } from "@svelte-put/clickoutside";

  export let expanded = false;
  export let klass;

  function toggleDisplay() {
    expanded = !expanded;
  }

  function hide() {
    expanded = false;
  }
</script>

<div class={klass} use:clickoutside on:clickoutside={hide}>
  {#if expanded}
    <a href="" on:click|preventDefault={toggleDisplay}><slot name="text" /></a>
    <slot />
  {:else}
    <a href="" on:click|preventDefault={toggleDisplay}><slot name="text" /></a>
  {/if}
</div>
