const url = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vS633xawej_g4NqY1lvC6RwrM3y717c5nk1Znqm1iE0mBYsHiICWAC4s1DORbgj5YCFZvOaHEVTdKud/pubhtml';

async function run() {
  const res = await fetch(url);
  const text = await res.text();
  
  const regex = /name:\s*"([^"]+)",\s*id:\s*"([^"]+)"/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    console.log(`Tab: ${match[1]}, GID: ${match[2]}`);
  }
}
run();
