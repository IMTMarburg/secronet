
<script lang="ts">
  import { base } from "$app/paths";
  import Toggler from "./Toggler.svelte";
  export let name;
  export let items;
  export let selected;
</script>


<Toggler
text="<p>{name}</p>"
	cls="picker"
	klass="picker_div"
>
	<div slot="text" style="float-left;" >
		<p>{name}</p>
	</div>
<div style="float-left;">
<a>No filter</a><br />
<a>Option A</a><br />
<a>Option B</a><br />
</div>

</Toggler>

<style>
	:global( .picker_div)
	{
		display: inline;
		border: 1px dashed blue;
		border-radius: 1em;
		padding-left: 1em;
		padding-right: 1em;
	}
</style>



