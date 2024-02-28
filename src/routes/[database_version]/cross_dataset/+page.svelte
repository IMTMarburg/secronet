<script lang="ts">
  import CrossDatasetAutoComplete from "$lib/components/CrossDatasetAutoComplete.svelte";
  import { onMount, onDestroy, createEventDispatcher } from "svelte";
  import { browser } from "$app/environment";
  import Toggler from "$lib/components/Toggler.svelte";
  import { base } from "$app/paths";
  export let data;

  let dataset = "RP1 - OvCA HPMC proteome and secretome";
  let selected;
  let bokeh_target = null;

  let identifiers = [
    { name: "OID20211 / ANGPTL1 / ENSG00000116194" },
    { name: "ENSMUSG00000033544 / Angptl1" },
  ];

  async function add_identifier() {
    if (selected) {
      if (!identifiers.includes(selected)) {
        identifiers.push({
          name: selected,
        });
      }
    }
    //keep sorted
    identifiers.sort();
    identifiers = identifiers;
  }

  function remove_identifier(identifier) {
    identifiers = identifiers.filter(function (value, index, arr) {
      return value.name != identifier;
    });
  }

  function clear_identifiers() {
    identifiers = identifiers;
  }

  async function get_data(identifier) {
    var datas = [];
    var answer = await fetch(
      base +
        "/" +
        data.database_version +
        "/cross_dataset_row?" +
        new URLSearchParams({
          identifier: identifier.name,
          empty_ok: "true",
        })
    );
    answer = await answer.json();
    datas = answer;
    return datas;
  }

  async function bk(identifiers) {
    if (!browser || !bokeh_target) {
      return;
    }
    bokeh_target.innerHTML = "Yes";
    let Bokeh = window.Bokeh;

    if (identifiers.length == 0) {
      bokeh_target.innerHTML = "No identifiers selected";
    } else {
      bokeh_target.innerHTML = "";
      for (let identifier of identifiers) {
        let data = await get_data(identifier);
        for (let value_name of Object.keys(data)) {
          let bokeh_input = data[value_name];

          const categories = bokeh_input["x"];
          let unique_condition_values = [...new Set(categories)];

          let y_column = "y";
          console.log(bokeh_input);
          var yrange_naive = [
            Math.min(...bokeh_input[y_column]),
            Math.max(...bokeh_input[y_column]),
          ];
          if (value_name == "log2fc") {
            yrange_naive[0] = Math.min(yrange_naive[0], -1);
          }
          if (yrange_naive[0] == yrange_naive[1]) {
            yrange_naive[0] = yrange_naive[0] - 0.1;
            yrange_naive[1] = yrange_naive[0] + 0.1;
          }
          let ydist = yrange_naive[1] - yrange_naive[0];
          let yrange = [
            yrange_naive[0] - ydist * 0.1,
            yrange_naive[1] + ydist * 0.1,
          ]; // add some space.
          let SaveTool = Bokeh.Models._known_models.get("SaveTool");
          let custom_tooltips = [];
          custom_tooltips.push(["", "@parsed_info{safe}"]);

          bokeh_input["parsed_info"] = bokeh_input["info"].map(function (info) {
            var res = "";
            let keys = Object.keys(info);
			//sort case insensitive
			keys.sort(function(a, b) {
				return a.toLowerCase().localeCompare(b.toLowerCase());
			});
            for (let key of keys) {
              res += "<b><b>" + key + "</b></b>: " + info[key] + "<br />";
            }
            return res;
          });
          var tools = [
            "pan",
            "crosshair",
            "wheel_zoom",
            "box_zoom",
            "reset",
            new SaveTool({
              filename:
                dataset.replace("/", "_") +
                "_" +
                identifier.name.replace("/", ""),
            }),
          ];

          var y_axis_type = "auto";
          /*if (meta["columns"][value_name]["log"] ?? false) {
      y_axis_type = "log";
      yrange = null;
    }*/

          const p = Bokeh.Plotting.figure({
            //width: 400,
            //height: 400,
            width: document.body.clientWidth * 0.9,
            title:
              "Cross dataset plot - " + identifier.name + " - " + value_name,
            tools: tools,
            x_axis_label: value_name,
            y_axis_label: "condition",
            y_range: unique_condition_values,
            x_range: yrange,
            x_axis_type: y_axis_type,
          });

          const source = new Bokeh.ColumnDataSource({ data: bokeh_input });
          let Jitter = Bokeh.Models._known_models.get("Jitter");
          let jitter = new Jitter({ width: 0.4, range: p.y_range });

          // background rectangles
          const bg = new Bokeh.Rect({
            x: yrange[0] + (yrange[1] - yrange[0]) / 2,
            width: (yrange[1] - yrange[0]) * 10,
            y: { field: "y" },
            height: 1,
            fill_color: { field: "color" },
            fill_alpha: 0.5,
          });
          console.log(yrange[1] - yrange[0]);

          var bg_color = [];
          for (let i = 0; i < unique_condition_values.length; i++) {
            if (i % 2 == 0) {
              bg_color.push("FFFFFF");
            } else {
              bg_color.push("#BBBBBB");
            }
          }
          const bg_source = new Bokeh.ColumnDataSource({
            data: { y: unique_condition_values, color: bg_color },
          });
          p.add_glyph(bg, bg_source);

          const glyph = new Bokeh.Scatter({
            y: { field: "x", transform: jitter },
            x: { field: "y" },
            line_color: "#66FF99",
            line_width: 0,
            size: 20,
          });
          let glyph_render = p.add_glyph(glyph, source);
          if (value_name == "FDR") {
            //add a horizontal line at 0.05
            p.add_layout(
              new Bokeh.Span({
                location: 0.05,
                dimension: "height",
                line_color: "red",
                line_dash: "dashed",
              })
            );
            p.add_layout(
              new Bokeh.Span({
                location: 0.001,
                dimension: "height",
                line_color: "blue",
                line_dash: "dashed",
              })
            );
          }
          p.add_tools(
            new Bokeh.HoverTool({
              tooltips: custom_tooltips,
              renderers: [glyph_render],
            })
          );

          Bokeh.Plotting.show(p, bokeh_target);
        }
      }
    }
  }

  $: bk(identifiers);
  onMount(() => {
    identifiers = identifiers;
  });
</script>

<br />
<p class="title">Cross dataset view</p>
<p style="margin-left:1em; margin-top:0;">
  <Toggler klass="inline_toggler">
    <div slot="text">Help</div>
	<div class="popup">
	You are in the cross dataset view.<br />
	Choose any number of identifiers by typing in the box. <br />
	You can search for example for partial gene names.	<br />
	Then pick a 'full identifier' from the list. <br />
	<br />
	Hover over the points in the plot to see their full data. <br />
	<br />
	Note that one gene/protein might have serveral identifiers
	depending on the measurement method used (RNAseq, mass-spec, Olink.... You can therefore add multiple identifiers (just reclick the box), 
	and receive one plot per identifier.<br />
	<br />
	Each row in a plot is one 'condition' in one dataset.<br />
	Hover over the points to learn which dataset they are from. <br />
	</div>
	</Toggler>
<hr />
<div>
  <b> Search identifiers </b>
  <CrossDatasetAutoComplete
    {dataset}
    database_version={data.database_version}
    column="Assay"
    bind:selected
    prefix="false"
    autofocus="true"
  />
  <!-- onChange={add_identifier} -->
  <input type="button" value="Add" on:click={add_identifier} />
</div>

<div>
  <b> Selected identifiers </b>
  {#if identifiers.length > 0}
    <ul class="nav">
      {#each identifiers as identifier}
        <li>
          {identifier.name}
          <a on:click={remove_identifier(identifier.name)}>Remove</a>
        </li>
      {/each}
    </ul>
  {:else}
    No identifers Selected
  {/if}
</div>
<hr />

<div bind:this={bokeh_target}>...</div>

<!-- <div>
  {#if identifiers.length > 0}
    {#each identifiers as identifier}
      <h3>{identifier.name}</h3>
      {#await get_data(identifier) then rd}
        <pre>
		  {JSON.stringify(rd, null, 2)}
		  </pre>
      {:catch error}
        <p class="error">An error occurred: {error.message}</p>
      {/await}
    {/each}
  {/if}
</div> -->
