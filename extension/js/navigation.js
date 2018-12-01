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
function blockUrlIfMatch(details) {
	createTabRecordIfNeeded(details.tabId);
	if (/^[^:/]+:\/\/[^/]*stackexchange\.[^/.]+\//.test(details.url)) {
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
chrome.webNavigation.onBeforeNavigate.addListener(blockUrlIfMatch);


function handleBeforeNavigation(e) {
	confirm('Do you want to?');
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

chrome.webNavigation.onCompleted.addListener(handleNavigation);
// chrome.webNavigation['onBeforeNavigate'].addListener(handleBeforeNavigation);
