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

// Migrations
chrome.runtime.onInstalled.addListener(function (details) {
  if (details.reason === "update") {
    var thisVersion = chrome.runtime.getManifest().version;
    if (["0.0.1", "0.0.2"].includes(details.previousVersion)) {
      // migrate to local storage
      chrome.storage.sync.get(null, function (result) {
        chrome.storage.local.set(result, function () {
          const error = chrome.runtime.lastError;
          if (error) {
            console.log("Error migrating to local storage", error);
            return;
          }
          console.log("Migrated data to local storage");
        });
      });
    }
    if (["1.0.0"].includes(thisVersion)) {
      // migrate database
      chrome.storage.local.get(null, function (result) {
        if (result) {
          // there is something in the database
          const firstKey = Object.keys(result).pop();
          if (typeof result[firstKey] === "string") {
            // v1 database
            const newDatabase = Object.entries(result).reduce(
              (acc, [key, meaning]) => {
                acc[key] = {
                  meaning,
                  created: new Date().getTime(),
                  updated: new Date().getTime(),
                };
                return acc;
              },
              {}
            );
            chrome.storage.local.set(newDatabase, function () {
              if (error) {
                console.log("Error migrating to local storage", error);
                return;
              }
              console.log("Migrated data v2");
            });
          }
        }
      });
    }
  }
});
