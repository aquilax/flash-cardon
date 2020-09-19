const wordsTextarea = document.getElementById("words");

function formatDate(timestamp) {
  try {
    return new Date(parseInt(timestamp, 10)).toISOString();
  } catch (e) {
    console.error(timestamp, e);
  }
  return new Date().toISOString();
}

function load() {
  chrome.storage.local.get(null, function (result) {
    wordsTextarea.value = Object.entries(result)
      .map(([original, v]) => ({ original, ...v }))
      .sort((a, b) => a.created - b.created)
      .map((item) =>
        [
          item.original,
          item.meaning,
          formatDate(item.created),
          formatDate(item.updated),
        ].join("\t")
      )
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

function dateToTimestamp(date) {
  return new Date(date).getTime();
}

document.getElementById("update").addEventListener("click", () => {
  const confirmed = confirm("Are you sure you want to overwrite all words?");
  if (confirmed) {
    const newPayload = wordsTextarea.value
      .split("\n")
      .filter((l) => l.trim())
      .reduce((acc, l) => {
        const row = l.split("\t");
        if (row.length > 2) {
          const [k, meaning, createdDate, updatedDate] = row;
          acc[k] = {
            meaning,
            created: dateToTimestamp(createdDate),
            updated: dateToTimestamp(updatedDate),
          };
        } else {
          // support for v1 format
          const [k, meaning] = row;
          acc[k] = {
            meaning,
            created: dateToTimestamp(new Date()),
            updated: dateToTimestamp(new Date()),
          };
        }
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
  element.setAttribute("download", `${getDate()}-flash-cardon-export-v2.tsv`);
  element.style.display = "none";
  document.body.appendChild(element);
  element.click(e);
  document.body.removeChild(element);
});

load();
