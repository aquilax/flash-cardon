((window) => {
  const cleaner = new RegExp(/[\.,!\?#\:;–0-9"”\*\+\=\|]/, "g");

  function normalizeWord(word) {
    return word.toLowerCase().replace(cleaner, "").trim();
  }

  // https://stackoverflow.com/a/21696585
  function isTextNodeVisible(node) {
    return node.parentNode.offsetParent !== null;
  }

  function textNodesUnder(el) {
    const nodes = [];
    let node;
    const walk = window.document.createTreeWalker(
      el,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );
    while ((node = walk.nextNode())) {
      if (node && isTextNodeVisible(node) && normalizeWord(node.textContent)) {
        nodes.push(node);
      }
    }
    return nodes;
  }

  function getReplacement(text, words) {
    return text.split(" ").reduce((acc, w) => {
      wrd = normalizeWord(w);
      if (wrd) {
        var span = window.document.createElement("span");
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
        var nonWord = window.document.createTextNode(w);
        acc.push(nonWord);
      }
      var space = window.document.createTextNode(" ");
      acc.push(space);
      return acc;
    }, []);
  }

  function getFrequency(allWords) {
    return allWords.reduce((acc, k) => {
      acc[k] = acc[k] ? acc[k] + 1 : 1;
      return acc;
    }, {});
  }

  function getWords(nodes, callback) {
    const allWords = nodes
      .map((n) => n.textContent)
      .reduce((acc, t) => {
        let w = t
          .split(" ")
          .map(normalizeWord)
          .filter((w) => w);
        return [...acc, ...w];
      }, []);
    chrome.storage.local.get(Array.from(new Set(allWords)), function (result) {
      callback(Array.from(allWords), result, getFrequency(allWords));
    });
  }

  function addFrequency(frequency, knownWords, topN = 10) {
    const known = Object.keys(knownWords);
    const sorted = Object.entries(frequency)
      .filter((e) => known.indexOf(e[0]) === -1)
      .sort((a, b) => b[1] - a[1])
      .slice(0, topN);
    let frequencyNode = document.getElementById("flash-cardon-frequency");
    if (!frequencyNode) {
      frequencyNode = window.document.createElement("div");
      frequencyNode.id = "flash-cardon-frequency";
      window.document.body.appendChild(frequencyNode);
    }
    frequencyNode.textContent = sorted
      .map((p) => `${p[0]} : ${p[1]}`)
      .join("\n");
  }

  function addSummary(allWords, knownWords) {
    let summaryNode = document.getElementById("flash-cardon-summary");
    if (!summaryNode) {
      summaryNode = window.document.createElement("span");
      summaryNode.id = "flash-cardon-summary";
      window.document.body.appendChild(summaryNode);
    }
    summaryNode.textContent = `w: ${knownWords.length}/${allWords.length}`;
  }

  var nodes = textNodesUnder(window.document.body);
  getWords(nodes, (allWords, knownWords, frequency) => {
    for (let i = 0; i < nodes.length; i++) {
      if (nodes[i]) {
        let text = nodes[i].textContent;
        if (text.trim()) {
          newChildren = getReplacement(text, knownWords);
          nodes[i].replaceWith(...newChildren);
        }
      }
    }
    addFrequency(frequency, knownWords);
    addSummary(allWords, Object.keys(knownWords));
  });

  if (!window.flashCardon) {
    window.document.addEventListener("dblclick", (ev) => {
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
          chrome.storage.local.set(
            { [target.dataset.word]: value.trim() },
            function () {
              const error = chrome.runtime.lastError;
              if (error) {
                alert(error);
                return;
              }

              Array.from(
                window.document.querySelectorAll(
                  `[data-word="${target.dataset.word}"]`
                )
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
})(window);
