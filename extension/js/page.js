'use strict';

const debug = true;

console.log('Script loaded');

let substituteStr = null;

function substituteNode(node) {
	var i;
	var ignore = {
		"STYLE": 0,
		"SCRIPT": 0,
		"NOSCRIPT": 0,
		"IFRAME": 0,
		"OBJECT": 0,
		"INPUT": 0,
		"FORM": 0,
		"TEXTAREA": 0
	};
	if (node.parentElement.tagName in ignore) {
		return;
	}
	node.nodeValue = substituteStr(node.nodeValue);
}


function substituteAll(root) {
	var node;
	var iter = document.createNodeIterator(root, NodeFilter.SHOW_TEXT);
	while ((node = iter.nextNode())) {
		substituteNode(node);
	}
}

function updateSubstitutions(blocked_letters, blocked_words) {

	var ignore, i, replacementsObject, original;
	replacementsObject = [];
	for (i = blocked_letters.length - 1; i >= 0; i--) {
		original = new RegExp(blocked_letters[i], "gi");
		replacementsObject.push([original, ""]);
	}
	for (i = blocked_words.length - 1; i >= 0; i--) {
		original = new RegExp("\\b" + blocked_words[i] + "\\b", "gi");
		replacementsObject.push([original, ""]);
	}

	substituteStr = function (str) {
		for (i = replacementsObject.length - 1; i >= 0; i--) {
			str = str.replace(replacementsObject[i][0], replacementsObject[i][1]);
		}
		return str;
	};

	substituteAll(document);
	if (document.title)
		document.title = substituteStr(document.title);
}

updateSubstitutions('a b c d e'.split(' '), 'cat'.split(' '));

// Setup mutation observer
const observer = new MutationObserver(function (mutations) {
	mutations.forEach(function (mutation) {
		for (var i = 0; i < mutation.addedNodes.length; i++) {
			substituteAll(mutation.addedNodes[i]);
		}
	})
});
observer.observe(document, {childList: true, subtree: true});

chrome.runtime.sendMessage("Hello World, before page load");
chrome.storage.local.get(null, console.log);

//// Click handling

function handleClick(e) {
	let isLink = false;
	let link = null;
	if (debug) console.log("Click detected", e);
	for (let i = 0; i < e.path.length; i++) {
		const elem = e.path[i];
		if (elem.nodeName === 'A') {
			isLink = true;
			link = elem;
			break;
		}
	}

	if (isLink) {
		if (debug) console.log("It's a link!", link);

		e.preventDefault();
		e.stopImmediatePropagation();
	}
}

document.addEventListener('click', handleClick);