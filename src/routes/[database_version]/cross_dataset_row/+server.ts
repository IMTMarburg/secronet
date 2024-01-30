import { json } from "@sveltejs/kit";
import { pl } from "nodejs-polars";
import { get_meta, get_row, list_datasets } from "$lib/data";

export async function GET({ url, params }: LoadInput) {
  var database_version = params.database_version;
  var identifier = url.searchParams.get("identifier");
  var datasets = await list_datasets(database_version);

  var out_by_value = {};
  for (var dataset of datasets) {
    //console.log(input);
    var input = null;
    try {
      input = await get_row(identifier, database_version, dataset.name);
    } catch (e) {
      //console.log(e);
      continue;
    }

    if (input.shape.height > 0) {
      var meta = await get_meta(database_version, dataset.name);
      for (var idx_value_column of meta.value_columns) {
        var value_column = idx_value_column;
		if (value_column == "imputed") {
			continue;
		}
        if (out_by_value[value_column] == undefined) {
          out_by_value[value_column] = { "x": [], "y": [], "info": [] };
        }

        var x_columns = Object.entries(meta["columns"])
          .filter(([_, value]) =>
            (value["kind"] == "condition") &&
            (
              (value["xaxis"] == "axis") ||
              (value["xaxis"] == "color")
            )
          )
          .sort(([_, a], [__, b]) =>
            Number(a["order"] ?? 0) - Number(b["order"] ?? 0)
          )
          .map(([key, _]) => key);
        //let values = await casted.collect();
        let out = {
          "x": [],
          "y": input[value_column].toArray(),
          "info": [],
        };
        {
          let values = input.select(pl.col(x_columns).cast(pl.Utf8));
          let rows = values.rows();
          for (var row of rows) {
            out["x"].push(row.join(" / "));
          }
        }
        {
          let cols = Object.keys(meta["columns"]);
          console.log(cols);
          let values = input.select(pl.col(cols).cast(pl.Utf8));
          let rows = values.rows();
          for (var row of rows) {
            var entry = {};
            for (var v in cols) {
              entry[cols[v]] = row[v];
            }
            entry["dataset"] = dataset.name;
            out["info"].push(entry);
          }
        }

        //refactor into loop
        for (var key in out_by_value[value_column]) {
          out_by_value[value_column][key] = out_by_value[value_column][key]
            .concat(out[key]);
        }
      }
    }
  }

  return json(out_by_value);
}
