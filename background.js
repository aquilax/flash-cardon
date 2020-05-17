chrome.contextMenus.removeAll();
chrome.contextMenus.create({
  id: "manage-words",
  title: "Manage words",
  contexts: ["browser_action"],
});

chrome.contextMenus.onClicked.addListener(function (info, tab) {
  if (info.menuItemId === "manage-words") {
    chrome.tabs.create({ url: "/words.html" });
  }
});

chrome.browserAction.onClicked.addListener(function (tab) {
  chrome.tabs.insertCSS({
    file: "style.css",
  });
  chrome.tabs.executeScript({
    file: "contentScript.js",
  });
});
