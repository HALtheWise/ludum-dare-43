// Tribute to  justin.giancola and the s/keyboard/leopard chrome extension.
// Icon and idea are from www.xkcd.com/1288
// Taken from https://github.com/Posnet/xkcd-substitutions

chrome.runtime.sendMessage("config", function(response) {
  "use strict";
  // taken from http://stackoverflow.com/questions/17264639/replace-text-but-keep-case
  function matchCase(text, pattern) {
    var result = '';
    for (var i = 0; i < text.length; i++) {
      var c = text.charAt(i);
      var p = pattern.charCodeAt(i);
      if (p >= 65 && p < 65 + 26) {
        result += c.toUpperCase();
      } else {
        result += c.toLowerCase();
      }
    }
    return result;
  }
  var substitute = (function() {
    "use strict";
    var replacements, ignore, i, replacementsObject, original;
    replacements = response;
    replacementsObject = [];
    for (i = replacements.length - 1; i >= 0; i--) {
      if (replacements[i][0].length == 1){
        original = new RegExp(replacements[i][0], "gi");
      } else {
        original = new RegExp("\\b" + replacements[i][0] + "\\b", "gi");        
      }
      replacementsObject.push([original, replacements[i][1]]);
    }
    return function(node) {
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
      for (i = replacementsObject.length - 1; i >= 0; i--) {
        node.nodeValue = node.nodeValue.replace(replacementsObject[i][0], function(match) {
          return matchCase(replacementsObject[i][1], match);
        });
      }
    };
  })();

  var substituteAll = function (root) {
    var node;
    var iter = document.createNodeIterator(root, NodeFilter.SHOW_TEXT);
    while ((node = iter.nextNode())) {
      substitute(node);
    }
  };

  substituteAll(document.body);

  const observer = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
      for (var i = 0; i < mutation.addedNodes.length; i++) {
        substituteAll(mutation.addedNodes[i]);
      }
    })
  });
  observer.observe(document.body, {childList: true, subtree: true});

});
