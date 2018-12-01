'use strict';

console.log('Script loaded');

const blocked_letters = 'a b c d e'.split(' ');
const blocked_words = 'the'.split(' ');

var substituteStr = (function () {
	"use strict";
	var replacements, ignore, i, replacementsObject, original;
	replacementsObject = [];
	for (i = blocked_letters.length - 1; i >= 0; i--) {
		original = new RegExp(blocked_letters[i], "gi");
		replacementsObject.push([original, ""]);
	}
	for (i = blocked_words.length - 1; i >= 0; i--) {
		original = new RegExp("\\b" + blocked_words[i] + "\\b", "gi");
		replacementsObject.push([original, ""]);
	}

	return function (str) {
		for (i = replacementsObject.length - 1; i >= 0; i--) {
			str = str.replace(replacementsObject[i][0], function (match) {
				return matchCase(replacementsObject[i][1], match);
			});
		}
		return str;
	};
})();

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

substituteAll(document.body);
document.title = substituteStr(document.title);


const observer = new MutationObserver(function (mutations) {
	mutations.forEach(function (mutation) {
		for (var i = 0; i < mutation.addedNodes.length; i++) {
			substituteAll(mutation.addedNodes[i]);
		}
	})
});
observer.observe(document.body, {childList: true, subtree: true});