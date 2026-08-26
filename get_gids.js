const url = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTqfjKFDoUBtQ3srOsi-1-mzsMjSVdz5vGusc3KIde4SpdW_55vzBqydXpu7cyFFcY3sW4fni42SB3e/pub';

async function run() {
  const res = await fetch(url);
  const text = await res.text();
  
  // Look for: {name: "Tab Name", id: "gid"}
  // or a javascript array that has the tab names.
  const regex = /name: "([^"]+)", id: "([^"]+)"/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    console.log(`Tab: ${match[1]}, GID: ${match[2]}`);
  }
}
run();
