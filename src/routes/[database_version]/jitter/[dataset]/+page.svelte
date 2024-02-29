<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from "svelte";
  import { browser } from "$app/environment";
  import Toggler from "$lib/components/Toggler.svelte";
  import MetaTable from "$lib/components/MetaTable.svelte";

  import { unified } from "unified";
  import { remark } from "remark";
  import remarkGfm from "remark-gfm";
  import html from "remark-html";


  async function format_markdown(text) {
    const file = await remark().use(remarkGfm).use(html).process(text);
    return String(file);
  }

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
    var data = await fetch(
      base +
        "/" +
        database_version +
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
	if (yrange_naive[0] == yrange_naive[1]) {
		yrange_naive[1] = yrange_naive[0] + 0.1;
	}
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

    const p = Bokeh.Plotting.figure({
      //width: 400,
      //height: 400,
      width: document.body.clientWidth * 0.9,
      title: "Jitter Plot - " + identifier,
      tools: tools,
      y_axis_label: value_column,
      x_axis_label: condition_columns.join(" / "),
      x_range: unique_condition_values,
      y_range: yrange,
      y_axis_type: y_axis_type,
    });
    //p.legend.location = "center";
    const source = new Bokeh.ColumnDataSource({ data: bokeh_input });
    let Jitter = Bokeh.Models._known_models.get("Jitter");
    let jitter = new Jitter({ width: 0.4, range: p.x_range });

    let legend_items = [];
    let Legend = Bokeh.Models._known_models.get("Legend");
    let LegendItem = Bokeh.Models._known_models.get("LegendItem");

    let color_columns = condition_columns.filter(
      (col) => meta["columns"][col]["xaxis"] == "color"
    );
    let color = "darkgrey";
    if (color_columns.length > 0) {
      let CategoricalColorMapper = Bokeh.Models._known_models.get(
        "CategoricalColorMapper"
      );
      const color_categories = bokeh_input[color_columns[0]];
      let unique_color_categories = [...new Set(color_categories)];
      let palette = [
        "#1C86EE",
        "#E31A1C",
        "#008B00",
        "#6A3D9A",
        "#FF7F00",
        "#4D4D4D",
        "#FFD700",
        "#7EC0EE",
        "#FB9A99",
        "#90EE90",
        "#0000FF",
        "#FDBF6F",
        "#B3B3B3",
        "#EEE685",
        "#B03060",
        "#FF83FA",
        "#FF1493",
        "#0000FF",
        "#36648B",
        "#00CED1",
        "#00FF00",
        "#8B8B00",
        "#CDCD00",
        "#A52A2A",
      ];
      let cmap = new CategoricalColorMapper({
        palette: palette,
        factors: unique_color_categories,
      });
      color = { field: color_columns[0], transform: cmap };
      for (var i = 0; i < unique_color_categories.length; i++) {
        legend_items.push(
          new LegendItem({
            label: unique_color_categories[i],
            renderers: [
              p.scatter("", "", {
                marker: "circle",
                color: palette[i % palette.length],
                size: 20,
                source: null,
              }),
            ],
          })
        );
      }
    }
    let shape_columns = condition_columns.filter(
      (col) => meta["columns"][col]["xaxis"] == "shape"
    );
    let shape = "circle";
    if (shape_columns.length > 0) {
      let CategoricalMarkerMapper = Bokeh.Models._known_models.get(
        "CategoricalMarkerMapper"
      );
      const shape_categories = bokeh_input[shape_columns[0]];
      let unique_shape_categories = [...new Set(shape_categories)];
      let markers = [
        "circle",
        "square",
        "triangle",
        "asterisk",
        "circle_x",
        "square_x",
        "inverted_triangle",
        "x",
        "circle_cross",
        "square_cross",
      ];
      let smap = new CategoricalMarkerMapper({
        factors: unique_shape_categories,
        markers: markers,
      });
      shape = {
        field: shape_columns[0],
        transform: smap,
        legend_label: shape_columns[0],
      };
      for (var i = 0; i < unique_shape_categories.length; i++) {
        legend_items.push(
          new LegendItem({
            label: unique_shape_categories[i],
            renderers: [
              p.scatter("", "", {
                marker: markers[i % markers.length],
                size: 20,
                color: "darkgrey",
                source: null,
              }),
            ],
          })
        );
      }
    }

    const glyph = new Bokeh.Scatter({
      x: { field: x_columns[0], transform: jitter },
      y: { field: value_column },
      fill_color: color,
      marker: shape,
      // line_color: "#66FF99",
      line_width: 0,
      size: 20,
    });
    p.add_glyph(glyph, source);

    let legend = new Legend({ items: legend_items, orientation: "vertical" });

    p.add_layout(legend, "left");

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

<br />
<p class="title">{dataset}</p>
<p style="margin-left:1em; margin-top:0;">
  <Toggler klass="inline_toggler">
    <div slot="text">Help</div>
	<div class="popup">
	You are viewing a single dataset. <br />
	Choose an identifier by typing in the box. <br />
	You can search for example for partial gene names.	<br />
	Then pick a 'full identifier' from the list. <br />
	<br />
	Hover over the points in the plot to see their full data. <br />
	<br />
	Click Metadata or Description to learn more about this dataaset.
	</div>
	</Toggler>
  <Toggler klass="inline_toggler">
    <div slot="text">Metadata</div>
	<div>
	<MetaTable meta={data.meta} table_class="popup" />
	</div>
  </Toggler>
  <Toggler klass="inline_toggler">
    <div slot="text">Description</div>
	<div class="popup">
    {#await format_markdown(meta.description)}
      loading...
    {:then text}
      {@html text}
    {:catch error}
      An error occured: {error.message}
    {/await}
	</div>
  </Toggler>
</p>
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
      database_version={data.database_version}
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
