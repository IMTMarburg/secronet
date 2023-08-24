<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from "svelte";
  import { browser } from "$app/environment";

  import Toggler from "$lib/components/Toggler.svelte";

  import DatasetAutoComplete from "$lib/components/DatasetAutoComplete.svelte";
  import { base } from "$app/paths";

  export let data;
  let dataset = data.dataset;
  let meta = data.meta;
  let value_columns = meta.value_columns;
  let condition_columns = meta.condition_columns;

  console.log(meta);
  let selected = meta['defaultIdentifer']; //"Agt / ENSMUSG00000031980 / ANGT_MOUSE-0";
  let value_column = value_columns[0];

  let bokeh_target;

  $: (selected ?? "") != "" ? bk(selected, value_column) : null;

  function get_column_values(data, column_name) {
    let cols = data["columns"];
    let col = cols.find((col) => col["name"] == column_name);
    return col["values"];
  }

  async function bk(identifier, value_column) {
    if (!browser) {
      return;
    }
    var data = await fetch(
      base +
        "/row?" +
        new URLSearchParams({
          dataset: dataset,
          identifier: identifier,
        })
    );
    data = await data.json();
    meta = data["meta"];
    var df = JSON.parse(data["data"]);

    let bokeh_input = Object.fromEntries(
      Object.entries(data["meta"]["columns"]).map(([key, value]) => [
        key,
        get_column_values(df, key),
      ])
    );

    document.getElementById("debug").innerHTML =
      "<pre>" + JSON.stringify(bokeh_input, null, 2) + "</pre>";
    let Bokeh = window.Bokeh;

    let x_columns = condition_columns.filter(
      (col) => meta["columns"][col]["xaxis"] == "axis"
    );
	if (bokeh_input[x_columns[0]].length == 0) {
		bokeh_target.innerHTML = "No data found for this identifier";
		return;
	}
    const categories = bokeh_input[x_columns[0]];
    let unique_condition_values = [...new Set(categories)];

    let y_column = value_column;
    var yrange_naive = [
      Math.min(...bokeh_input[y_column]),
      Math.max(...bokeh_input[y_column]),
    ];
    if (y_column == "log2fc") {
      yrange_naive[0] = Math.min(yrange_naive[0], -1);
    }
    let ydist = yrange_naive[1] - yrange_naive[0];
    let yrange = [yrange_naive[0] - ydist * 0.1, yrange_naive[1] + ydist * 0.1]; // add some space.

    document.getElementById("debug").innerHTML +=
      "<pre>" + JSON.stringify(categories, null, 2) + "</pre>";
    const p = Bokeh.Plotting.figure({
      width: 400,
      height: 400,
      title: "Jitter Plot - " + identifier,
      y_axis_label: value_column,
      x_axis_label: condition_columns.join(" / "),
      x_range: unique_condition_values,
      y_range: yrange,
    });
    const source = new Bokeh.ColumnDataSource({ data: bokeh_input });
    let Jitter = Bokeh.Models._known_models.get("Jitter");
    let jitter = new Jitter({ width: 0.4, range: p.x_range });
    const glyph = new Bokeh.Scatter({
      x: { field: x_columns[0], transform: jitter },
      y: { field: value_column },
      line_color: "#66FF99",
      line_width: 0,
      size: 10,
    });
    p.add_glyph(glyph, source);

    bokeh_target.innerHTML = "";
    Bokeh.Plotting.show(p, bokeh_target);
  }
  /*
  const categories = bokeh_input[condition_columns[0]];
  let unique_condition_values = [...new Set(categories)];
    const values = bokeh_input[value_column];

    // Jittering manually (in the range -0.5 to 0.5 for demonstration)
    const jittered_values = values.map(val => val);

	let yrange_naive = [Math.min(...bokeh_input[value_column]), Math.max(...bokeh_input[value_column])];

	const p = Bokeh.Plotting.figure({ width: 400, height: 400, title: 'Jitter Plot' ,
	x_range: unique_condition_values,
	y_range: yrange,
	});

    //p.circle({ x: categories, y: jittered_values, size: 1 });
	const source = new Bokeh.ColumnDataSource({data: bokeh_input});
	let Jitter = Bokeh.Models._known_models.get("Jitter")
	let jitter = new Jitter({width: .4, range:p.x_range});
	const line = new Bokeh.Scatter({
      x: { field: x_columns[0], transform: jitter},
      y: { field: value_column},
      line_color: "#66FF99",
      line_width: 2,
	  size: 10,
    });
    p.add_glyph(line, source);



    Bokeh.Plotting.show(p, bokeh_target);

	return;

  }

  onMount(async () => {
    //await bk(row);
    selected = "ABHD14B / OID20921 / ENSG00000114779";
  });
  */
</script>

<h2>{dataset}</h2>

<label for="value_columns">Value column to show:</label>
{#if value_columns.length > 1}
  <select id="value_columns" bind:value={value_column}>
    {#each value_columns as value}
      <option {value}>{value}</option>
    {/each}
  </select>
{:else}
  <input type="hidden" id="value_columns" bind:value={value_column} />
  {value_column}
{/if}

<br />
<!-- {#each condition_columns as cc}
  <label>Condition column: {cc}</label>
  <select data-cc={cc}>
    <option value="color">As color</option>
    <option value="x">On X axis</option>
    <option value="ignore">Ignore</option>
  </select>
{/each}
<br />
 -->
<label for="selected">Entry of interest:</label>
<DatasetAutoComplete
  {dataset}
  column="Assay"
  bind:selected
  prefix="false"
  autofocus="true"
/>
<br />
You chave chosen:
{selected}

<div style="border: 1px solid black" />

<div bind:this={bokeh_target} />

<div id="debug" />

<pre>
{JSON.stringify(meta, null, 2)}
</pre>

<style>
pre {
color: blue;
}
:global(.dsa-input) {
width:30em !important;
}
</style>
