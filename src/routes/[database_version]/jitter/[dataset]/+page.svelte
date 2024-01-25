<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from "svelte";
  import { browser } from "$app/environment";


  import DatasetAutoComplete from "$lib/components/DatasetAutoComplete.svelte";
  import { base } from "$app/paths";

  export let data;
  let dataset = data.dataset;
  let database_version = data.database_version;
  let meta = data.meta;
  let value_columns = meta.value_columns;
  let condition_columns = meta.condition_columns;

  let selected = null; //"Agt / ENSMUSG00000031980 / ANGT_MOUSE-0";
  let value_column = value_columns[0];

  let bokeh_target;

  $: (selected ?? "") != "" ? bk(selected, value_column) : null;

  function formatHashParameters(identifier, value_column) {
    let params = new URLSearchParams();
    params.set("identifier", identifier);
    params.set("value_column", value_column);
	return params;
  }

  function setHashParameters(identifier, value_column) {
    let params = formatHashParameters(identifier, value_column);
    window.location.hash = params.toString();
  }
  function getHashParameters() {
    return new URLSearchParams(window.location.hash.substring(1));
  }

  $: if (selected !== null) {
    setHashParameters(selected, value_column);
  }

  function get_column_values(data, column_name) {
    let cols = data["columns"];
    let col = cols.find((col) => col["name"] == column_name);
    return col["values"];
  }

  async function bk(identifier, value_column) {
    if (!browser) {
      return;
    }
    console.log(identifier);
    var data = await fetch(
      base + "/" + database_version +
        "/row?" +
        new URLSearchParams({
          dataset: dataset,
          identifier: identifier,
        })
    );
    //set anchor to identifier
    window.location.hash = identifier;
    data = await data.json();
    meta = data["meta"];
    var df = JSON.parse(data["data"]);

    let bokeh_input = Object.fromEntries(
      Object.entries(data["meta"]["columns"]).map(([key, value]) => [
        key,
        get_column_values(df, key),
      ])
    );

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

    let SaveTool = Bokeh.Models._known_models.get("SaveTool");
    let custom_tooltips = [];
    for (var c in meta["columns"]) {
      custom_tooltips.push([c, "@" + c]);
    }
    const tools = [
      "pan",
      "crosshair",
      "wheel_zoom",
      "box_zoom",
      "reset",
      new SaveTool({
        filename: dataset.replace("/", "_") + "_" + identifier.replace("/", ""),
      }),
      new Bokeh.HoverTool({ tooltips: custom_tooltips }),
    ];

    var y_axis_type = "auto";
    if (meta["columns"][value_column]["log"] ?? false) {
      y_axis_type = "log";
      yrange = null;
    }
	console.log({
      //width: 400,
      //height: 400,
      title: "Jitter Plot - " + identifier,
      tools: tools,
      y_axis_label: value_column,
      x_axis_label: condition_columns.join(" / "),
      x_range: unique_condition_values,
      y_range: yrange,
      y_axis_type: y_axis_type,
    });

    const p = Bokeh.Plotting.figure({
      //width: 400,
      //height: 400,
      title: "Jitter Plot - " + identifier,
      tools: tools,
      y_axis_label: value_column,
      x_axis_label: condition_columns.join(" / "),
      x_range: unique_condition_values,
      y_range: yrange,
      y_axis_type: y_axis_type,
    });
    const source = new Bokeh.ColumnDataSource({ data: bokeh_input });
    let Jitter = Bokeh.Models._known_models.get("Jitter");
    let jitter = new Jitter({ width: 0.4, range: p.x_range });
    const glyph = new Bokeh.Scatter({
      x: { field: x_columns[0], transform: jitter },
      y: { field: value_column },
      line_color: "#66FF99",
      line_width: 0,
      size: 20,
    });
    p.add_glyph(glyph, source);
    if (value_column == "FDR") {
      //add a horizontal line at 0.05
      p.add_layout(
        new Bokeh.Span({
          location: 0.05,
          dimension: "width",
          line_color: "red",
          line_dash: "dashed",
        })
      );
      p.add_layout(
        new Bokeh.Span({
          location: 0.001,
          dimension: "width",
          line_color: "blue",
          line_dash: "dashed",
        })
      );
    }

    bokeh_target.innerHTML = "";
    Bokeh.Plotting.show(p, bokeh_target);
  }

  onMount(() => {
    let params = getHashParameters();
    let from_url = params.get("identifier", null) ?? meta["defaultIdentifier"];
    let vc = params.get("value_column") ?? value_column;
    if (from_url == "" || from_url == undefined) {
      from_url = meta["defaultIdentifer"];
    }
    selected = from_url;
    value_column = vc;
  });
</script>

<svelte:head>
  <title>Secronet - {dataset} - jitter</title>
</svelte:head>

<p class="title">{dataset}</p>
<hr />

<div class="form-container">
  <div class="form-row">
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
  </div>
  <div class="form-row">
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
	  database_version = {data.database_version}
      column="Assay"
      bind:selected
      prefix="false"
      autofocus="true"
    />
  </div>
</div>

<hr />
{#if selected === null}
  Loading...
{:else}
  You have chosen:
  <a href="#{formatHashParameters(selected, value_column)}">{selected}</a>
{/if}

<div bind:this={bokeh_target} />

<div id="debug" />

<style>
  :global(.dsa-input) {
    width: 30em !important;
  }
</style>
