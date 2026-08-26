const url = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vS633xawej_g4NqY1lvC6RwrM3y717c5nk1Znqm1iE0mBYsHiICWAC4s1DORbgj5YCFZvOaHEVTdKud/pubhtml';
async function run() {
  const res = await fetch(url);
  const text = await res.text();
  // Extract all list items with gid
  const regex = /<li(?:[^>]*)><a href="\?gid=([0-9]+)[^>]*>([^<]+)<\/a><\/li>/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    console.log(`Tab: ${match[2]}, GID: ${match[1]}`);
  }
}
run();
