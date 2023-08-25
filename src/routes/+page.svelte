<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from "svelte";
  import { browser } from "$app/environment";
  import Tree from "$lib/components/Tree.svelte";

  import Toggler from "$lib/components/Toggler.svelte";

  import DatasetAutoComplete from "$lib/components/DatasetAutoComplete.svelte";
  import { base } from "$app/paths";

  export let data;

  import Tree from "svelte-tree";
  function addPath(tree, path) {
    let currentLevel = tree;
    path.split("/").forEach((part, index, array) => {
      let existingPath = currentLevel.find((child) => child.name === part);
      if (!existingPath) {
        existingPath = { name: part, children: [], path: path };
        currentLevel.push(existingPath);
      }

      if (index === array.length - 1) {
        existingPath.leaf = true;
      } else {
        currentLevel = existingPath.children;
      }
    });
  }

  function pathsToTree(paths) {
    const tree = [];
    paths.forEach((path) => addPath(tree, path));
    return tree;
  }
  let tree = pathsToTree(data.datasets.map((x) => x.name));
</script>

<h2>Dataset selector</h2>

<Tree {tree} let:node>
  <div class="name">
    {#if node.leaf}
      <a href="jitter?dataset={node.path}">{node.name}</a>
    {:else}
      {@html node.name}
    {/if}
  </div>
</Tree>
