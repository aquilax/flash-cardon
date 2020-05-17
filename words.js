const wordsTextarea = document.getElementById("words");
chrome.storage.sync.get(null, function (result) {
  wordsTextarea.value = Object.keys(result)
    .sort()
    .map((k) => `${k}\t${result[k]}`)
    .join("\n");
});

document.getElementById("update").addEventListener("click", () => {
  const confirmed = confirm("Are you sure you want to overwrite all words?");
  if (confirmed) {
    const newPayload = wordsTextarea.value
      .split("\n")
      .filter((l) => l.trim())
      .reduce((acc, l) => {
        const [k, v] = l.split("\t");
        acc[k] = v;
        return acc;
      }, {});
    console.log(newPayload);
  }
});
