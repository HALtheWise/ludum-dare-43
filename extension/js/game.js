const debug = true;

let enabled = true;

let tabs = [];
let sacrifices;

function resetGame() {
	sacrifices = new SacrificesMade([], []);
}

resetGame();

function onMessage(msg, sender, sendResponse) {
	console.log("Got message", msg);
	if (msg[0] === 'sacrifices') {
		sacrifices = msg[1];

		for (let i = 0; i < tabs.length; i++) {
			chrome.tabs.sendMessage(tabs[i], ['sacrifices', sacrifices]);
		}

	} else {
		chrome.tabs.sendMessage(sender.tab.id, ['sacrifices', sacrifices]);
	}
}

chrome.tabs.onUpdated.addListener(function (tabid) {
	if (!tabs.includes(tabid)) {
		tabs.push(tabid);

	}
});

chrome.runtime.onMessage.addListener(onMessage);