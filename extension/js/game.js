const debug = true;

let enabled = true;

function injectionScript(tabId, info, tab) {
	if (debug) {
		console.log("injection fire");
	}

	if (enabled && !tab.url.startsWith('chrome://')) {
		chrome.tabs.executeScript(tabId, {
			file: "js/page.js",
			runAt: "document_start"
		}, function () {
			if (debug) {
				console.log('Script Executed');
			}
		});
	}
}

function handleBeforeNavigation(e) {
// debugger;
}

function handleNavigation(e) {
	const banned_transitions = ['typed'];
	let typed_string = "";

	if (banned_transitions.includes(e.transitionType)) {
		typed_string = e.url;
	}




// 	if (banned_transitions.includes(data.transitionType) || data.transitionQualifiers.includes('from_address_bar')) {
// 		confirm("Performing this search will permanently sacrifice the letters a, b, c, d, and e\nDo you accept this sacrifice?");
// 		chrome.tabs.remove(data.tabId);
// 		if (debug) {
// 			console.log("Closed tab due to", data);
// 		}
// 		chrome.tabs.create({"url": "https://reddit.com"})
// 	}
}

chrome.tabs.onUpdated.addListener(injectionScript);
// chrome.runtime.onStartup.addListener(fixDataCorruption);
chrome.webNavigation['onCommitted'].addListener(handleNavigation);
chrome.webNavigation['onBeforeNavigate'].addListener(handleBeforeNavigation);
