((window) => {
  const CSS_WORD = "flash-cardon-word";
  const CSS_KNOWN = "known";
  const CSS_UNKNOWN = "unknown";

  const cleaner = new RegExp(/[\.,!\?#\:;–0-9"”\*\+\=\|•]/, "g");

  const state = ((storage) => {
    return {
      set: (keys, callback) => {
        return storage.set(keys, callback);
      },
      get: (query, callback) => {
        return storage.get(query, callback);
      },
    };
  })(chrome.storage.local);

  function normalizeWord(word) {
    return word.toLowerCase().replace(cleaner, "").trim();
  }

  // https://stackoverflow.com/a/21696585
  function isTextNodeVisible(node) {
    return node.parentNode.offsetParent !== null;
  }

  function getTextNodesUnder(el) {
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
        let span = window.document.createElement("span");
        span.dataset.word = wrd;
        span.textContent = w;
        span.classList.add(CSS_WORD);
        if (words[wrd]) {
          word = words[wrd];
          span.classList.add(CSS_KNOWN);
          span.dataset.meaning = word.meaning;
          span.dataset.created = word.created;
          span.dataset.updated = word.updated;
          span.title = word.meaning;
        } else {
          span.classList.add(CSS_UNKNOWN);
        }
        acc.push(span);
      } else if (w) {
        let nonWord = window.document.createTextNode(w);
        acc.push(nonWord);
      }
      let space = window.document.createTextNode(" ");
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
      .map((node) => node.textContent)
      .reduce((acc, t) => {
        const w = t
          .split(" ")
          .map(normalizeWord)
          .filter((w) => w);
        return [...acc, ...w];
      }, []);
    state.get(Array.from(new Set(allWords)), function (result) {
      callback(nodes, Array.from(allWords), result, getFrequency(allWords));
    });
  }

  function addSummary(frequency, knownWords, extraLines = [], topN = 10) {
    const known = Object.keys(knownWords);
    const sorted = Object.entries(frequency)
      .filter((e) => known.indexOf(e[0]) === -1)
      .sort((a, b) => b[1] - a[1])
      .slice(0, topN);
    let summaryNode = document.getElementById("flash-cardon-summary");
    if (!summaryNode) {
      summaryNode = window.document.createElement("div");
      summaryNode.id = "flash-cardon-summary";
      window.document.body.appendChild(summaryNode);
    }
    const lines = sorted.map((p) => `${p[0]} : ${p[1]}`);
    lines.push(...extraLines);
    summaryNode.textContent = lines.join("\n");
  }

  function onGetWords(nodes, allWords, knownWords, frequency) {
    for (let i = 0; i < nodes.length; i++) {
      if (nodes[i]) {
        let text = nodes[i].textContent;
        if (text.trim()) {
          newChildren = getReplacement(text, knownWords);
          nodes[i].replaceWith(...newChildren);
        }
      }
    }
    addSummary(frequency, knownWords, [
      "-----------------",
      `known/total: ${Object.keys(knownWords).length}/${allWords.length}`,
    ]);
  }

  function updateDocumentWithWord(original, word) {
    Array.from(
      window.document.querySelectorAll(`[data-word="${original}"]`)
    ).forEach((node) => {
      node.classList.add(CSS_KNOWN);
      node.classList.remove(CSS_UNKNOWN);
      node.dataset.meaning = word.meaning;
      node.dataset.created = word.created;
      node.title = word.meaning;
    });
  }

  function saveWord(original, word) {
    state.set({ [original]: word }, function () {
      const error = chrome.runtime.lastError;
      if (error) {
        return alert(error);
      }
      updateDocumentWithWord(original, word);
    });
  }

  function askForMeaning(original, meaning) {
    return (
      window.prompt(`What is the meaning of "${original}"`, meaning) || ""
    ).trim();
  }

  function getTimestamp() {
    return new Date().getTime();
  }

  function onWordDoubleClick(event) {
    const target = event.target;
    if (target.classList.contains(CSS_WORD)) {
      const original = target.dataset.word;
      const promptMeaning = target.classList.contains(CSS_KNOWN)
        ? target.dataset.meaning
        : original;
      const created = target.classList.contains(CSS_KNOWN)
        ? parseInt(target.dataset.created, 10)
        : getTimestamp();
      const meaning = askForMeaning(original, promptMeaning);

      if (meaning) {
        saveWord(original, { meaning, created, updated: getTimestamp() });
      }
    }
  }

  if (!window.flashCardon) {
    // Initialize
    window.flashCardon = true;
    window.document.addEventListener("dblclick", onWordDoubleClick);
    const nodes = getTextNodesUnder(window.document.body);
    getWords(nodes, onGetWords);
  }
})(window);
