<script lang="ts">
  import { base } from "$app/paths";
  export let data;

if (import.meta.hot) {
  import.meta.hot.on(
    "vite:beforeUpdate",
    () => console.clear()
  );
}

</script>


<svelte:head>
</svelte:head>
<h1><a href="../">Secronet</a>
</h1>
<slot />
