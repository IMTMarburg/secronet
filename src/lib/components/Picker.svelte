
<script lang="ts">
  import { base } from "$app/paths";
  import Toggler from "./Toggler.svelte";
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();
  export let name;
  export let items;
  export let selected = null;
  //export an event on_chosen
  let on_chosen = null;
  let toggler_expanded = false;

  function select(ev) {
	  let val = ev.target.dataset.value;
	  selected = (" " + val).slice(1);
	  dispatch('chosen', {name: name, value: selected});
	  toggler_expanded = false;
  }

</script>


<Toggler
	klass="picker_div"
	bind:expanded={toggler_expanded}
>
	<div slot="text">
		{#if selected}
			<span class="selected">{name}: {selected ?? ""}</span>
		{:else}
			<span>{name}</span>
		{/if}
	</div><ul style="position:absolute;background-color:white;padding:1em; border: 1px dashed black;">
		<li><a on:click={select} data-value="">No&nbsp;filter</a></li>
	{#each items as item}
		{#if item == selected}
			<li><b>{item}</b></li>
		{:else}
			<li style="white-space:nowrap;"><a on:click={select} data-value="{item}">{item}</a></li>
		{/if}
	{/each}

</ul>

</Toggler>

<style>
	:global( .picker_div)
	{
		display: inline;
		border: 1px dashed blue;
		border-radius: 1em;
		padding-left: 1em;
		padding-right: 1em;
		float:left;
		position:relative;
	}

	.selected {
	font-weight:bold;
	color:#1010FF;
	}
</style>



