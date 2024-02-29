<script lang="ts">
  export let meta;
  export let table_class = "";
  export let header = true;
</script>

<div>
  <table class="{table_class}">
  {#if header}
    <tr>
      <th>Key</th>
      <th>Value</th>
    </tr>
	{/if}
    {#each Object.entries(meta.tags).sort( // case insensitive
		(a, b) => a[0].toLowerCase().localeCompare(b[0].toLowerCase())
		)
	as [key, value]}
      <tr>
        <td>{key}</td>
        <td>{value}</td>
      </tr>
    {/each}
  </table>
</div>
