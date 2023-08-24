<script>
  export let node;
  import Tree from './Tree.svelte';
</script>

<style>
  .leaf {
  }
.indent {
    margin-left: 20px;
  }

</style>

  {#each Object.keys(node) as key}
    <div class="indent">
      {#if Object.keys(node[key]).length === 0}
        <a href={`jitter?dataset=${node[key].path}`} class="leaf">{key}</a>
      {:else}
        {key}
        <Tree node={node[key]} />
      {/if}
    </div>
  {/each}
