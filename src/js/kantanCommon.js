// FirefoxでinnerTextが使えない対策
(function(){
    var temp = document.createElement("div");
    if (temp.innerText == undefined) {
        Object.defineProperty(HTMLElement.prototype, "innerText", {
            get: function()  { return this.textContent },
            set: function(v) { this.textContent = v; }
        });
    }
})();

var eventListeners = [];
function on(elementOrQuery, eventName, callback) {
	var element;
	if (typeof elementOrQuery === "string") {
		element = document.querySelectorAll(elementOrQuery);
	} else {
		element = [elementOrQuery];
	}
	
	for (var i = 0; i < element.length; i++) {
		element[i].addEventListener(eventName, callback);
		
		eventListeners.push({
			element: element[i],
			eventName: eventName,
			callback: callback,
		});	
	}
}

function removeAllEvents() {
	for (var i = 0; i < eventListeners.length; i++) {
		var element = eventListeners[i].element;
		var eventName = eventListeners[i].eventName;
		var callback = eventListeners[i].callback;
		element.removeEventListener(eventName, callback);
	}
	eventListeners = [];
}

function isEnable(elem) {
	return elem &&
			((typeof elem.disabled === "undefined")
			|| (elem.disabled == false));
}

function isVisible(elem) {
	var style = elem.currentStyle || document.defaultView.getComputedStyle(elem, '');
	if (style.display == "none") {
		return false;
	}
	var parent = (elem.tagName.toLowerCase() == "body") ? null : elem.parentNode;
	if (!parent) {
		return true;
	} else {
		return isVisible(parent);
	}
}

function showBlock(elem) {
	elem.style.display = "";
	if (!isVisible(elem)) {
		elem.style.display = "block";
	}
}

function hide(elem) {
	elem.style.display = "";
	if (isVisible(elem)) {
		elem.style.display = "none";
	}
}

function addClass(elem, className) {
	elem.classList.add(className);
}

function removeClass(elem, className) {
	elem.classList.remove(className);
	if (elem.className == "") {
		elem.removeAttribute("class");
	}
}

function getItem(name, defaultValue) {
	try {
		var value = localStorage.getItem("com.tatesuke.ktm." + name);
		return (value != null) ? value : defaultValue;
	} catch(e) {
		return defaultValue;
	}
}

function setItem(name, value) {
	try {
		localStorage.setItem("com.tatesuke.ktm." + name, value);
	} catch(e) {
		// 握りつぶし
	}
}

function base64ToBlob(base64) {
	var mimeType = base64.match(/^\s*data:(.*);base64/)[1];
	var bin = atob(base64.replace(/^.*,/, ''));
	var buffer = new Uint8Array(bin.length);
	for (var i = 0; i < bin.length; i++) {
		buffer[i] = bin.charCodeAt(i);
	}
	var blob = new Blob([buffer.buffer], {
		type: mimeType
	});
	return blob;
}

function insertToEditor(editor, insertText) {
	var text = editor.value;
	var newPos = editor.selectionStart + insertText.length;
	var part1 = text.substring(0, editor.selectionStart);
	var part2 = text.substr(editor.selectionEnd);
	editor.value = part1 + insertText + part2;
	editor.selectionStart = newPos;
	editor.selectionEnd = newPos;
	updateScrollPos(editor);
	var event= document.createEvent("Event");
	event.initEvent("changeByJs",false,false);
	editor.dispatchEvent(event);
}

function updateScrollPos(editor) {
	// 初期状態を保存
	var text = editor.value;
	var selectionStart = editor.selectionStart;
	var selectionEnd   = editor.selectionEnd;

	// insertTextコマンドで適当な文字(X)の追加を試みる
	var isInsertEnabled;
	try {
		isInsertEnabled = document.execCommand("insertText", false, "X");
	} catch(e) {
		// IE10では何故かfalseを返さずに例外が発生するのでcatchで対応する
		isInsertEnabled = false;
	}
	
	if (isInsertEnabled) {
		// insertTextに成功したらChrome
		// chromeはどう頑張ってもまっとうな手段が通用しない。
		// 苦肉の策としてselectionStart,endを揃えてから
		// 一旦フォーカスを外してすぐに戻す。そうするとスクロールバーが追従する
		// これにより、chromeではblurやfocusイベントはまともに使えなくなる黒魔術
		editor.value = text;
		editor.selectionStart = selectionStart;
		editor.selectionEnd = selectionStart;
		editor.blur();
		editor.focus();
		
		// valは戻してあるのでキャレット位置のみ元に戻す
		editor.selectionStart = selectionStart;
		editor.selectionEnd = selectionEnd;
	} else {
		// IE,FirefoxはinsertTextに失敗するのでval関数で適当な文字(X)を挿入する。
		// IEではその後にその文字を選択してdeleteコマンドで削除するとスクロールバーが追従する
		var part1 = text.substring(0, selectionStart);
		var part2 = text.substr(selectionEnd);
		editor.value = part1 + "X" + part2;
		editor.selectionStart = part1.length;
		editor.selectionEnd = part1.length + 1;
		var isDeleteEnabled = document.execCommand("delete", false, null);
		
		// 追従した後はvalとキャレットを元に戻す
		editor.value = text;
		editor.selectionStart = selectionStart;
		editor.selectionEnd = selectionEnd;
	}
}