<script lang="ts">
  export let expanded = false;
  export let klass;
  let show_long = expanded == "true";

  function toggleDisplay() {
    show_long = !show_long;
  }
</script>

<div class={klass}>
  {#if show_long}
    <a href="" on:click|preventDefault={toggleDisplay}><slot name="text" /></a>
    <slot />
  {:else}
    <a href="" on:click|preventDefault={toggleDisplay}><slot name="text" /></a>
  {/if}
</div>
