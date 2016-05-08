/* 保存機能 */
(function KtmCoreSave(prototype, ktm){
	
	const _$body             = document.body;
	const _$previewerStyle   = document.getElementById("previewerStyle");
	const _$messageArea      = document.getElementById("messageArea");
	const _$saveButton       = document.getElementById("saveButton");
	const _$wrapper          = document.getElementById("wrapper");
	const _$editor           = document.getElementById("editor");
	const _$cssEditor        = document.getElementById("cssEditor");
	const _$previewer        = document.getElementById("previewer");
	const _$updateScriptArea = document.getElementById("updateScriptArea");
	
	var _saved = true;

	document.addEventListener('DOMContentLoaded', function() {
		on(_$saveButton, "click", ktm.save);
		window.onbeforeunload = onbeforeunload;
	});
	
	prototype.save = function() {
		trigger(_$body, "ktm_befor_save");
		
		var html = ktm.getHTMLForSave();
		var blob = new Blob([html]);
		
		if (window.navigator.msSaveBlob) {
			/* for IE */
			window.navigator.msSaveBlob(blob, document.title + ".html");
		} else {
			var url     = window.URL || window.webkitURL;		
			var blobURL = url.createObjectURL(blob);
			var a       = document.createElement('a');
			a.download  = document.title.replace(/^\* /, "") + ".html";
			a.href      = blobURL;
			
			// firefoxでa.click()が効かないため無理やりclickイベントをディスパッチする
			var ev = document.createEvent("MouseEvents");
		    ev.initMouseEvent("click", true, false, self, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
			a.dispatchEvent(ev);
			delete a;
		}
		
		trigger(_$body, "ktm_after_save");
	}

	prototype.getHTMLForSave = function() {
		var wrapperScrollTop   = _$wrapper.scrollTop;
		var previewerScrollTop = _$previewer.scrollTop;
		
		// アップデート用のscriptタグは差分の原因になるので消す
		_$updateScriptArea.innerHTML = "";
		
		// テキストエリアは値を入れなおさないと保存されない。
		_$editor.innerHTML    = _$editor.value.replace(/</g, "&lt;");
		_$cssEditor.innerHTML = _$cssEditor.value;
		
		// プレビューモードで保存する
		var toggleFlag = ktm.isEditMode();
		if (toggleFlag == true) {
			ktm.toggleMode();
		}
		addClass(document.body, "initialState");
		
		/* ファイルの肥大化を防ぐため中身を消去 */
		_$previewer.innerHTML       = "";
		_$messageArea.innerHTML     = "";
		_$previewerStyle.innerHTML  = "";
		
		// 不要なdiffの原因となるスタイルなどを削除
		if (document.title.match(/^\* .*/)) {
			document.title = document.title.substr("\* ".length);
		}
		
		var stylees = document.querySelectorAll("*[style]");
		for (var i = 0; i < stylees.length; i++) {
			var stylee = stylees[i];
			stylee.removeAttribute("style");
		}
		
		_$previewer.removeAttribute("class");
		
		// HTML生成
		// bug fix #1 #39
		var html  = "<!doctype html>\n<html>\n";
		html     += document.getElementsByTagName("html")[0].innerHTML;
		html      = html.substring(0, html.lastIndexOf("/script>"));
		html     += "/script>\n</body>\n</html>";
		
		_saved = true;
		ktm.doPreview();
		
		removeClass(document.body, "initialState");
		if (toggleFlag == true) {
			ktm.toggleMode();
		}
		
		_$previewer.scrollTop = previewerScrollTop;
		_$wrapper.scrollTop   = wrapperScrollTop;
		
		return html;
	}
	prototype.setSaved = function (isSaved) {
		_saved = isSaved;
		
		if (!_saved && !document.title.match(/^\*/)) {
			document.title = "* " + document.title;
		} else if (_saved && document.title.match(/^\*/)) {
			document.title = document.title.substr(2);
		}
	}
	prototype.isSaved = function() {
		return _saved;
	}
	
	function onbeforeunload() {
		if (!_saved) {
			return "ドキュメントが保存されていません。"
		}
	}

})(prototype, ktm);