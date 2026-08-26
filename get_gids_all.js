const url = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vS633xawej_g4NqY1lvC6RwrM3y717c5nk1Znqm1iE0mBYsHiICWAC4s1DORbgj5YCFZvOaHEVTdKud/pubhtml';
async function run() {
  const res = await fetch(url);
  const text = await res.text();
  
  const gids = ['1206128987', '1289271915', '2115178316'];
  for (const gid of gids) {
    const idx = text.indexOf(gid);
    if (idx !== -1) {
      console.log(`Found gid ${gid} near:`);
      console.log(text.substring(idx - 100, idx + 100));
    }
  }
}
run();
