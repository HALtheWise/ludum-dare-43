const debug = true;

let enabled = true;


function injectionScript(tabId, info, tab) {
	if (debug) {
		console.log("injection fire");
	}

	// if (enabled && !tab.url.startsWith('chrome://')) {
	// 	chrome.tabs.executeScript(tabId, {
	// 		file: "js/page.js",
	// 		runAt: "document_start"
	// 	}, function () {
	// 		if (debug) {
	// 			console.log('Script Executed');
	// 		}
	// 	});
	// }
}

chrome.tabs.onUpdated.addListener(injectionScript);
// chrome.runtime.onStartup.addListener(fixDataCorruption);

chrome.runtime.onMessage.addListener(console.log);