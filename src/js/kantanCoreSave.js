/* 保存機能 */
(function KtmCoreSave(prototype, ktm){
	
	const $previewerStyle   = document.getElementById("previewerStyle");
	const $messageArea      = document.getElementById("messageArea");
	const $wrapper          = document.getElementById("wrapper");
	const $editor           = document.getElementById("editor");
	const $cssEditor        = document.getElementById("cssEditor");
	const $previewer        = document.getElementById("previewer");
	const $updateScriptArea = document.getElementById("updateScriptArea");
	
	var _saved         = true;
	var _contentAtSave = $editor.value;

	document.addEventListener('DOMContentLoaded', function() {
		on("#saveButton", "click", ktm.save);
		window.onbeforeunload = onbeforeunload;
	});
	
	prototype.save = function() {
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
	}

	prototype.getHTMLForSave = function() {
		var wrapperScrollTop   = $wrapper.scrollTop;
		var previewerScrollTop = $previewer.scrollTop;
		
		// アップデート用のscriptタグは差分の原因になるので消す
		$updateScriptArea.innerHTML = "";
		
		// テキストエリアは値を入れなおさないと保存されない。
		$editor.innerHTML    = $editor.value.replace(/</g, "&lt;");
		$cssEditor.innerHTML = $cssEditor.value;
		
		// プレビューモードで保存する
		var toggleFlag = ktm.isEditMode();
		if (toggleFlag == true) {
			ktm.toggleMode();
		}
		addClass(document.body, "initialState");
		
		/* ファイルの肥大化を防ぐため中身を消去 */
		$previewer.innerHTML      = "";
		$messageArea.innerHTML    = "";
		$previewerStyle.innerHTML = "";
		
		// 不要なdiffの原因となるスタイルなどを削除
		if (document.title.match(/^\* .*/)) {
			document.title = document.title.substr("\* ".length);
		}
		
		var stylees = document.querySelectorAll("*[style]");
		for (var i = 0; i < stylees.length; i++) {
			var stylee = stylees[i];
			stylee.removeAttribute("style");
		}
		
		$previewer.removeAttribute("class");
		
		// HTML生成
		// bug fix #1 #39
		var html  = "<!doctype html>\n<html>\n";
		html     += document.getElementsByTagName("html")[0].innerHTML;
		html      = html.substring(0, html.lastIndexOf("/script>"));
		html     += "/script>\n</body>\n</html>";
		
		_contentAtSave = $editor.value;
		_saved = true;
		ktm.doPreview();
		
		removeClass(document.body, "initialState");
		if (toggleFlag == true) {
			ktm.toggleMode();
		}
		
		$previewer.scrollTop = previewerScrollTop;
		$wrapper.scrollTop   = wrapperScrollTop;
		
		return html;
	}
	
	prototype.isSaved = function() {
		return _saved;
	}
	prototype.updateSavedFlag = function() {
		_saved = (_contentAtSave == $editor.value);
	}

	function onbeforeunload() {
		if (!_saved) {
			return "ドキュメントが保存されていません。"
		}
	}

})(prototype, ktm);