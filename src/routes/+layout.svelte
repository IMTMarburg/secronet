<script lang="ts">
  import { base } from "$app/paths";
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  export let data;

  if (import.meta.hot) {
    import.meta.hot.on("vite:beforeUpdate", () => console.clear());
  }


  function goUpOnePathComponent() {
    const pathArray = window.location.pathname.split("/");
    console.log(pathArray);
    if (pathArray.length > 3) {
      var newPath = `/${pathArray.slice(1, 3).join("/")}`;
	  //cut off first char
	  console.log(newPath);
      return goto(newPath);
    } else {
      return goto("/secronet");
    }
	return false;
  }
</script>

<svelte:head />
<a on:click={goUpOnePathComponent} 
style="cursor:pointer;">
  ><img src="{base}/logo.svg" alt="Secronet logo" /></a
>
<slot />
