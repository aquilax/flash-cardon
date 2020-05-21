const wordsTextarea = document.getElementById("words");

function load() {
  chrome.storage.local.get(null, function (result) {
    wordsTextarea.value = Object.keys(result)
      .sort()
      .map((k) => `${k}\t${result[k]}`)
      .join("\n");
  });
}

function getDate() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(today.getDate()).padStart(2, "0")}`;
}

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
    chrome.storage.local.set(newPayload, function () {
      const error = chrome.runtime.lastError;
      if (error) {
        alert(error);
      }
      load();
    });
  }
});

document.getElementById("download").addEventListener("click", (e) => {
  var element = document.createElement("a");
  element.setAttribute(
    "href",
    "data:text/tab-separated-values;charset=utf-8," +
      encodeURIComponent(wordsTextarea.value)
  );
  element.setAttribute("download", `${getDate()}-flash-cardon-export.tsv`);
  element.style.display = "none";
  document.body.appendChild(element);
  element.click(e);
  document.body.removeChild(element);
});

load();
