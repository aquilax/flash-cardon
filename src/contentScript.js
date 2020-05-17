((window) => {
  const cleaner = new RegExp(/[\.,!\?#\:;\-–0-9"”\*\+]/, "g");

  function normalizeWord(word) {
    return word.toLowerCase().replace(cleaner, "").trim();
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
      if (node && node.textContent.trim()) {
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

  function getWords(nodes, callback) {
    const words = nodes
      .map((n) => n.textContent)
      .reduce((acc, t) => {
        let w = t
          .split(" ")
          .map(normalizeWord)
          .filter((w) => w);
        return [...acc, ...w];
      }, new Set());
    chrome.storage.sync.get(Array.from(words), function (result) {
      callback(result);
    });
  }

  var nodes = textNodesUnder(window.document.body);
  getWords(nodes, (words) => {
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
          chrome.storage.sync.set(
            { [target.dataset.word]: value.trim() },
            function () {
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
