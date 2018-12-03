'use strict';

const debug = true;

console.log('Script loaded');

let substituteStr = null;

function escapeRegExp(string) {
	return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

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
	if (!node.parentElement || node.parentElement.tagName in ignore ||
		node.parentElement.classList.contains('nofilter')) {
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

function updateSubstitutions(sacrifices) {

	var ignore, i, replacementsObject, original;
	replacementsObject = [];
	for (i = sacrifices.letters.length - 1; i >= 0; i--) {
		original = new RegExp(escapeRegExp(sacrifices.letters[i]), "gi");
		replacementsObject.push([original, ""]);
	}
	for (i = sacrifices.words.length - 1; i >= 0; i--) {
		original = new RegExp("\\b" + escapeRegExp(sacrifices.words[i]) + "\\b", "gi");
		replacementsObject.push([original, '-'.repeat(sacrifices.words[i].length)]);
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

let sacrifices = new SacrificesMade([], []);
updateSubstitutions(sacrifices);

// Setup mutation observer
const observer = new MutationObserver(function (mutations) {
	mutations.forEach(function (mutation) {
		for (var i = 0; i < mutation.addedNodes.length; i++) {
			substituteAll(mutation.addedNodes[i]);
		}
	})
});
observer.observe(document, {childList: true, subtree: true});

if (new URL(document.URL).host === "nationalzoo.si.edu") {
	// YOU WIN!
	sacrifices.won = true;
	chrome.runtime.sendMessage(['sacrifices', sacrifices])
}

chrome.runtime.sendMessage(['update_me', null]);

//// Click handling

function confirmLinkSacrifice(elem) {
	let s = [];

	let node;
	const iter = document.createNodeIterator(elem, NodeFilter.SHOW_TEXT);
	while ((node = iter.nextNode())) {
		s.push(node.nodeValue)
	}
	const iter2 = document.createNodeIterator(elem, NodeFilter.SHOW_ELEMENT);
	while ((node = iter2.nextNode())) {
		if (node.title) {
			s.push(node.title);
		}
		if (node.attributes["alt"]) {
			s.push(node.attributes["alt"].value);
		}
	}

	let words = s.join(' ').split(/[\s.-\/]/).filter(
		s => s.search(/\w/) !== -1 && s.length > 0);
	words = words.map(substituteStr);

	if (words.length === 0) {
		console.log("following link with no nested words");
		alert("You tried to click a link that has no text.");
		return true;
	}

	const warning = `You have clicked a link to ${elem.href}.
	 This requires a permanent sacrifice of the word${words.length > 1 ? 's' : ''} ` +
		textlist(words);


	const navigate = confirm(substituteStr(warning));

	if (navigate) {
		console.log("User elected to ban words", words);
		sacrifices.words.push(...words);
		sendUpdates();
	}

	return navigate;
}

function handleClick(e) {
	if (sacrifices.won) return;
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

		const navigate = confirmLinkSacrifice(link);

		if (navigate) {
		} else {
			ignore(e);
		}
	}
}

function ignore(e) {
	e.preventDefault();
	e.stopImmediatePropagation();
}

document.addEventListener('click', handleClick);
// document.addEventListener('mousedown', ignore);
// document.addEventListener('mouseup', ignore);

var hasAcceptedKeySacrifice = false;

function handleKey(e) {
	if (sacrifices.won) return;
	if (sacrifices.letters.includes(e.key)) {
		ignore(e);
		console.log(`"${e.key}" is banned already.`, e)
	} else {
		if (!hasAcceptedKeySacrifice) {
			const message = `By using the "${e.key}" key, you are choosing to permanently sacrifice that letter,` +
				` both for typing and display.\n You will not be warned again.`;
			hasAcceptedKeySacrifice = confirm(substituteStr(message));
		}
		if (hasAcceptedKeySacrifice) {
			sacrifices.letters.push(e.key);
			sendUpdates();
		} else {
			ignore(e);
			console.log("Key blocked", e);
		}
	}
}

document.addEventListener('keypress', handleKey);


// Messaging

function onMessage(msg, sender, sendResponse) {
	console.log("Got message", msg);
	if (msg[0] === 'sacrifices') {
		sacrifices = msg[1];
		updateSubstitutions(sacrifices);
		showOverlay();
	}
}

function sendUpdates() {
	chrome.runtime.sendMessage(['sacrifices', sacrifices])
}

let overlayDiv = null;

function showOverlay() {
	if (overlayDiv) {
		overlayDiv.remove();
	} else {
		let link = document.createElement("link");
		link.href = chrome.runtime.getURL("css/page.css");
		link.type = "text/css";
		link.rel = "stylesheet";
		document.head.appendChild(link);
	}
	overlayDiv = document.createElement('div');
	overlayDiv.id = 'panda_overlay';

	overlayDiv.innerHTML = `
<div id="block_page"></div>
<span id="not_won">
	<img class="pandaimg" alt="CUUUUTEE!" src="${chrome.runtime.getURL('images/cutepanda1.png')}"/>
	<div class="overlay_text">
		<span>Hello, my name is Bei Bei, and I am a panda cub that has gotten lost 
		on the internet. I need your help finding my home again.</span>
	
		<div class="horizontal_scroll">
			<div id="sacrificed_words" class="sacrifice">
			Words sacrificed: <span class="nofilter">${textlist(sacrifices.words)}</span></div>
		</div>
		<div class="horizontal_scroll">
			<div id="sacrificed_letters" class="sacrifice">
			Letters sacrificed: <span class="nofilter">${textlist(sacrifices.letters)}</span></div>
		</div>
	</div>
</span>

<span id="won" style="display: none">
	<img class="pandaimg" alt="CUUUUTEER!" src="${chrome.runtime.getURL('images/cutepanda2.png')}"/>
	<div class="overlay_text">

	Congratulations on beating this game, please rate it
	and leave comments on <a href="https://ldjam.com/events/ludum-dare/43/$129439">Ludum Dare</a>
	<br>
	If you want to play again, simply click <button id="resetbutton" style="color: black">here</button>.
	Otherwise, feel free to uninstall the extension.
	</div>
</span>
`;

	document.body.appendChild(overlayDiv);

	document.getElementById('resetbutton').onclick = reset;

	if (sacrifices.won) {
		document.getElementById('not_won').style.display = 'none';
		document.getElementById('won').style.display = 'unset';
	}
}

function reset(){
	sacrifices = new SacrificesMade([], []);
	sendUpdates();
	window.location = 'https://en.wikipedia.org';
}

document.addEventListener('DOMContentLoaded', showOverlay);

chrome.runtime.onMessage.addListener(onMessage);