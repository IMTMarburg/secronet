<script type="text/ts">
  import { page } from "$app/stores";

  import { unified } from "unified";
  import { remark } from "remark";
  import remarkGfm from "remark-gfm";
  import html from "remark-html";

  export let data;
  let dataset = data.dataset;

  let content = data.meta.description;

  async function format_markdown(text) {
    const file = await remark().use(remarkGfm).use(html).process(text);
    return String(file);
  }
</script>

<svelte:head>
  <title>Secronet - a GRK 2573/1 website</title>
</svelte:head>
<p class="title">{dataset}</p>
<hr />

<h2>Description</h2>

{#await format_markdown(data.meta.description)}
  loading...
{:then text}
  {@html text}
{:catch error}
  An error occured: {error.message}
{/await}

<h2>Metadata</h2>
<table>
  <tr>
    <th>Key</th>
    <th>Value</th>
  </tr>
  {#each Object.entries(data.meta.tags) as [key, value]}
    <tr>
      <td>{key}</td>
      <td>{value}</td>
    </tr>
  {/each}
</table>
