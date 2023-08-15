<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from "svelte";

  import Toggler from "$lib/components/Toggler.svelte";

  import DatasetAutoComplete from "$lib/components/DatasetAutoComplete.svelte";
  import { base } from "$app/paths";

  export let data;
  let v = JSON.parse(data.data);
  let selected;

  let bokeh_target;

  function bk() {
    let Bokeh = window.Bokeh;
    // create some data and a ColumnDataSource
    const x = Bokeh.LinAlg.linspace(-0.5, 20.5, 10);
    const y = x.map(function (v) {
      return v * 0.5 + 3.0;
    });
    const source = new Bokeh.ColumnDataSource({ data: { x: x, y: y } });

    // create some ranges for the plot
    const xdr = new Bokeh.Range1d({ start: -0.5, end: 20.5 });
    const ydr = new Bokeh.Range1d({ start: -0.5, end: 20.5 });

    // make the plot
    const plot = new Bokeh.Plot({
      title: "BokehJS Plot",
      x_range: xdr,
      y_range: ydr,
      width: 400,
      height: 400,
      background_fill_color: "#F2F2F7",
    });
	plot.add_tools(new Bokeh.PanTool(), new Bokeh.BoxZoomTool(), new Bokeh.WheelZoomTool(), new Bokeh.ResetTool());

    // add axes to the plot
    const xaxis = new Bokeh.LinearAxis({ axis_line_color: null });
    const yaxis = new Bokeh.LinearAxis({ axis_line_color: null });
    plot.add_layout(xaxis, "below");
    plot.add_layout(yaxis, "left");

    // add grids to the plot
    const xgrid = new Bokeh.Grid({ ticker: xaxis.ticker, dimension: 0 });
    const ygrid = new Bokeh.Grid({ ticker: yaxis.ticker, dimension: 1 });
    plot.add_layout(xgrid);
    plot.add_layout(ygrid);

    // add a Line glyph
    const line = new Bokeh.Line({
      x: { field: "x" },
      y: { field: "y" },
      line_color: "#666699",
      line_width: 2,
    });
    plot.add_glyph(line, source);

    Bokeh.Plotting.show(plot, bokeh_target);
  }

  onMount(async () => {
	  //bk();
	  selected = "ABHD14B / OID20921 / ENSG00000114779";

  });



	let dataset = "secretome/olink/TCell_Anna_Steitz/";


  async function getRow(identifier) {
  if (!identifier) return;
	const url = base + "/row/?identifier=" + encodeURIComponent(identifier) + "&dataset=" + encodeURIComponent(dataset);
	const response = await fetch(url);
	const json = await response.json();
	return json;
  }

  $: row = getRow(selected);
</script>

<DatasetAutoComplete
  dataset="secretome/olink/TCell_Anna_Steitz/"
  column="Assay"
  bind:selected
  prefix="false"
/>
{selected}

<div style="border: 1px solid black">
{#await row} Loading... 
{:then value}
	<pre>
	the row is {JSON.stringify(value, null, 2)}...
	</pre>
{/await}
</div>

<div bind:this={bokeh_target}></div>

