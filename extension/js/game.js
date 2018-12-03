const debug = true;

let enabled = true;

let tabs = [];
let sacrifices;

function resetGame() {
	sacrifices = new SacrificesMade([], []);
	chrome.windows.getAll(function (windows) {
		windows.forEach(function (window) {
			chrome.tabs.getAllInWindow(window.id, function (windowtabs) {
				tabs.push(...windowtabs.map(x => x.id))
			})
		})
	});
	sendUpdates();
}

function onMessage(msg, sender, sendResponse) {
	console.log("Got message", msg);
	if (msg[0] === 'sacrifices') {
		sacrifices = msg[1];
		sendUpdates();
	} else {
		chrome.tabs.sendMessage(sender.tab.id, ['sacrifices', sacrifices]);
	}
}

function sendUpdates() {
	// Normalize
	sacrifices.words = Array(...new Set(sacrifices.words.map(s => s.toLocaleLowerCase())));
	sacrifices.letters = Array(...new Set(sacrifices.letters.map(s => s.toLocaleLowerCase())));
	sacrifices.words.sort();
	sacrifices.letters.sort();
	sacrifices.words.filter(s=>s.search(/[a-z ]/) >= 0);
	sacrifices.letters.filter(s=>s.search(/[a-z ]/) >= 0);

	for (let i = 0; i < tabs.length; i++) {
		chrome.tabs.sendMessage(tabs[i], ['sacrifices', sacrifices]);
	}
}

chrome.tabs.onUpdated.addListener(function (tabid) {
	if (!tabs.includes(tabid)) {
		tabs.push(tabid);

	}
});

chrome.browserAction.onClicked.addListener(resetGame);

chrome.runtime.onMessage.addListener(onMessage);

chrome.runtime.onInstalled.addListener(resetGame);
chrome.runtime.onStartup.addListener(resetGame);

chrome.runtime.onInstalled.addListener(function (object) {
    chrome.tabs.create({url: "https://google.com"}, function (tab) {
        console.log("New tab launched");
    });
});