//Remember tab URLs
var tabsInfo = {};

function completedLoadingUrlInTab(details) {
	//console.log('details:',details);
	//We have completed loading a URL.
	createTabRecordIfNeeded(details.tabId);
	if (details.frameId !== 0) {
		//Only record inforamtion for the main frame
		return;
	}
	//Remember the newUrl so we can check against it the next time
	//  an event is fired.
	tabsInfo[details.tabId].priorCompleteUrl = tabsInfo[details.tabId].completeUrl;
	tabsInfo[details.tabId].completeUrl = details.url;
}

function InfoForTab(_url, _priorUrl) {
	this.completeUrl = (typeof _url !== 'string') ? "" : _url;
	this.priorCompleteUrl = (typeof _priorUrl !== 'string') ? "" : _priorUrl;
}

function createTabRecordIfNeeded(tabId) {
	if (!tabsInfo.hasOwnProperty(tabId) || typeof tabsInfo[tabId] !== 'object') {
		//This is the first time we have encountered this tab.
		//Create an object to hold the collected info for the tab.
		tabsInfo[tabId] = new InfoForTab();
	}
}


//Block URLs
function blockUrl(details) {
	createTabRecordIfNeeded(details.tabId);
	//Block this URL by navigating to the already current URL
	console.log('Blocking URL:', details.url);
	console.log('Returning to URL:', tabsInfo[details.tabId].completeUrl);
	if (details.frameId !== 0) {
		//This navigation is in a subframe. We currently handle that  by
		//  navigating to the page prior to the current one.
		//  Probably should handle this by changing the src of the frame.
		//  This would require injecting a content script to change the src.
		//  Would also need to handle frames within frames.
		//Must navigate to priorCmpleteUrl as we can not load the current one.
		tabsInfo[details.tabId].completeUrl = tabsInfo[details.tabId].priorCompleteUrl;
	}
	var urlToUse = tabsInfo[details.tabId].completeUrl;
	urlToUse = (typeof urlToUse === 'string') ? urlToUse : '';
	chrome.tabs.update(details.tabId, {url: urlToUse}, function (tab) {
		if (chrome.runtime.lastError) {
			if (chrome.runtime.lastError.message.indexOf('No tab with id:') > -1) {
				//Chrome is probably loading a page in a tab which it is expecting to
				//  swap out with a current tab.  Need to decide how to handle this
				//  case.
				//For now just output the error message
				console.log('Error:', chrome.runtime.lastError.message)
			} else {
				console.log('Error:', chrome.runtime.lastError.message)
			}
		}
	});
}


function blockUrlIfMatch(details) {
	if (/^[^:/]+:\/\/[^/]*stackexchange\.[^/.]+\//.test(details.url)) {
		blockUrl(details);
		//Notify the user URL was blocked.
		notifyOfBlockedUrl(details.url);
	}
}

function notifyOfBlockedUrl(url) {
	//This will fail if you have not provided an icon.
	chrome.notifications.create({
		type: 'basic',
//         iconUrl: 'blockedUrl.png',
		title: 'Blocked URL',
		message: url
	});
}


//Startup
chrome.webNavigation.onCompleted.addListener(completedLoadingUrlInTab);

// chrome.webNavigation.onBeforeNavigate.addListener(blockUrlIfMatch);


function handleBeforeNavigation(e) {
	confirm('Do you want to?');
}

function handleNavigation(e) {
	const search_providers = 'www.google.com bing.com facebook.com en.wikipedia.org search.yahoo.com'.split(' ');
	let typed_string = "";

	if (e.transitionQualifiers.includes('from_address_bar')) {
		const url = new URL(e.url);

		const params = new URLSearchParams(url.search);
		search_query = params.get('q') || params.get('p') || params.get('search');
		if (search_providers.includes(url.host) && search_query) {
			// User performed a search from the address bar
			console.log('Search detected', url);
			typed_string = search_query;
		} else if (e.transitionType === 'typed') {
			typed_string = url.host;
			if (typed_string.startsWith('www.')) {
				typed_string = typed_string.slice(4);
			}
		}
	}
	console.log("Detected navigation", e);

	if (typed_string.length > 0) {
		// The user is attempting navigation
		const letters = typed_string.split('');
		let disallow_reason = '';

		// TODO Check for sacrificed letters
		// if (clean)

		// Check for duplicate letters
		for (let i = 0; i < letters.length; i++) {
			const l = letters[i];

			if (l.search(/^[\w ]/) === -1)
			// Special characters don't fall for the double-count ban
				continue;

			if (letters.indexOf(l) !== letters.lastIndexOf(l)) {
				disallow_reason = `You may not sacrifice the letter "${l}" more than once!`;
				break;
			}
		}

		// Ask for their consent

		const message = `You are attempting to search for the phrase "${typed_string}".`
			+ `\nThis requires a permanent sacrifice of the letter${letters.length > 1 ? 's' : ''} `
			+ textlist(letters.map(s => `"${s}"`));

		let consent = false;
		if (!disallow_reason) {
			// TODO sanitize the letters and words in this message!
			consent = confirm(message);
		} else {
			alert(message + '\n Unfortunately... ' + disallow_reason);
		}

		console.log(consent);

		if (!consent) {
			// Undo the navigation action
			blockUrl(e);
		}
	}
	// confirm(``)


// 	if (banned_transitions.includes(data.transitionType) || data.transitionQualifiers.includes('from_address_bar')) {
// 		confirm("Performing this search will permanently sacrifice the letters a, b, c, d, and e\nDo you accept this sacrifice?");
// 		chrome.tabs.remove(data.tabId);
// 		if (debug) {
// 			console.log("Closed tab due to", data);
// 		}
// 		chrome.tabs.create({"url": "https://reddit.com"})
// 	}
}

chrome.webNavigation.onCommitted.addListener(handleNavigation);
// chrome.webNavigation['onBeforeNavigate'].addListener(handleBeforeNavigation);
