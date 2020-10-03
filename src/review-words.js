var words = [];
var currentWordIndex = 0;
var wordElement = document.getElementById("word");
var meaningElement = document.getElementById("meaning");
var summaryElement = document.getElementById("summary");

function shuffle(array) {
  var currentIndex = array.length,
    temporaryValue,
    randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {
    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

function transformWordsToArray(storageResult) {
  return Object.keys(storageResult).map((w) => ({
    word: w,
    ...storageResult[w],
  }));
}

function pickWord(wordList, currentWordIndex) {
  return wordList[currentWordIndex];
}

function showWord(word) {
  wordElement.innerText = word.word;
  meaningElement.innerText = word.meaning;
  summaryElement.innerText = `Added: ${new Date(
    word.created
  ).toLocaleDateString()} / Last reviewed: ${
    word.lastReviewed
      ? new Date(word.lastReviewed).toLocaleDateString()
      : "never"
  }`;
}

function markAsReviewed(currentWordIndex, callback) {
  const lastReviewed = new Date().getTime();
  // Update local cache
  words[currentWordIndex].lastReviewed = lastReviewed;
  chrome.storage.local.get(words[currentWordIndex].word, (w) => {
    w[words[currentWordIndex].word].lastReviewed = lastReviewed;
    chrome.storage.local.set(w, () => {
      callback();
    });
  });
}

function onLoadWords(storageResult) {
  words = shuffle(transformWordsToArray(storageResult));
  renderCurrentWord();
  document.addEventListener("keydown", (e) => {
    if (["KeyJ", "ArrowLeft"].includes(e.code)) {
      markAsReviewed(currentWordIndex, () => {
        currentWordIndex -= 1;
        if (currentWordIndex < 0) {
          currentWordIndex = words.length - 1;
        }
        return renderCurrentWord();
      });
    }
    if (["KeyK", "ArrowRight", "Space"].includes(e.code)) {
      markAsReviewed(currentWordIndex, () => {
        currentWordIndex += 1;
        if (currentWordIndex > words.length - 1) {
          currentWordIndex = 0;
        }
        return renderCurrentWord();
      });
    }
  });
}

function renderCurrentWord() {
  const word = pickWord(words, currentWordIndex);
  if (word) {
    return showWord(word);
  }
}

chrome.storage.local.get(null, onLoadWords);
