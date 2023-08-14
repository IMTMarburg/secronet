import { LoadInput, LoadOutput } from "@sveltejs/kit";

  import pl from 'nodejs-polars';

export async function load({ locals }: LoadInput): LoadOutput {
	let data = pl.readCSV('database/1/secretome/olink/TCell_Anna_Steitz/df.tsv', {sep: '\t'});
  return {
    user: locals.user,
	data: JSON.stringify(data.head(), null, 2),
  };
}
