export async function load({ fetch, params }) {
  const response = await fetch('https://raw.githubusercontent.com/domoritz/maps/master/data/iris.json')
  const dataFlowers = await response.json()

  return { flowers: dataFlowers }
}