import Papa from 'papaparse'
import { base } from '$app/paths'

export async function load({ fetch, params }) {
    const response = await fetch(base + "/games.csv", { 'header': { 'Content-Type': 'text/csv' } });
    let text_data = await response.text();
    let parsed_data = Papa.parse(text_data, { 'header': true });

    console.log(parsed_data)
    return {
        games: parsed_data.data
    }
}