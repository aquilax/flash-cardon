var cleaner = new RegExp(/[\.,!\?#\:;\-–0-9"”]/, "g");

function textNodesUnder(el) {
  var n,
    a = [],
    walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false);
  while ((n = walk.nextNode())) {
    if (n && n.textContent.trim()) {
      a.push(n);
    }
  }
  return a;
}

function getReplacement(text, words) {
  return text.split(" ").reduce((acc, w) => {
    wrd = w.toLowerCase().replace(cleaner, "").trim();
    if (wrd) {
      var span = document.createElement("span");
      span.dataset.word = wrd;
      span.textContent = w;
      span.classList.add("flash-cardon-word");
      if (words[wrd]) {
        span.classList.add("known");
        span.dataset.meaning = words[wrd];
        span.title = words[wrd];
      } else {
        span.classList.add("unknown");
      }
      acc.push(span);
    } else if (w) {
      var nonWord = document.createTextNode(w);
      acc.push(nonWord);
    }
    var space = document.createTextNode(" ");
    acc.push(space);
    return acc;
  }, []);
}

function getWords(nodes, callback) {
  const words = nodes
    .map((n) => n.textContent)
    .reduce((acc, t) => {
      let w = t
        .toLowerCase()
        .split(" ")
        .map((w) => w.replace(cleaner, "").trim())
        .filter((w) => w);
      return [...acc, ...w];
    }, new Set());
  chrome.storage.sync.get(Array.from(words), function (result) {
    callback(result);
  });
}

var nodes = textNodesUnder(document.body);
var words = getWords(nodes, (words) => {
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i]) {
      let text = nodes[i].textContent;
      if (text.trim()) {
        newChildren = getReplacement(text, words);
        nodes[i].replaceWith(...newChildren);
      }
    }
  }
});

if (!window.flashCardon) {
  document.addEventListener("dblclick", (ev) => {
    let target = ev.target;
    if (target.classList.contains("flash-cardon-word")) {
      let wrd = target.classList.contains("known")
        ? target.dataset.meaning
        : target.dataset.word;
      const value = window.prompt(
        `What is the meaning of "${target.dataset.word}"`,
        wrd
      );

      if (value) {
        chrome.storage.sync.set(
          { [target.dataset.word]: value.trim() },
          function () {
            Array.from(
              document.querySelectorAll(`[data-word="${target.dataset.word}"]`)
            ).map((n) => {
              n.classList.add("known");
              n.classList.remove("unknown");
              n.dataset.meaning = value.trim();
              n.title = value.trim();
            });
          }
        );
      }
    }
  });
  window.flashCardon = true;
}
