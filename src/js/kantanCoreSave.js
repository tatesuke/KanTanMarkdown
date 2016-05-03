/* アップデート機能 */
(function(prototype, ktm){

	document.addEventListener('DOMContentLoaded', function() {
	
	});

	prototype.isSaved = function() {
		return saved;
	}
	
	
	/* 保存 */
	var contentAtSave = editor.value;
	on("#saveButton", "click", save);
	function save() {
		var html = getHTMLForSave();
		
		var blob = new Blob([html]);
		if (window.navigator.msSaveBlob) {
			/* for IE */
			window.navigator.msSaveBlob(blob, document.title + ".html");
		} else {
			var url = window.URL || window.webkitURL;		
			var blobURL = url.createObjectURL(blob);
			var a = document.createElement('a');
			a.download = document.title.replace(/^\* /, "") + ".html";
			a.href = blobURL;
			
			// firefoxでa.click()が効かないため無理やりclickイベントをディスパッチする
			var ev = document.createEvent("MouseEvents");
		    ev.initMouseEvent("click", true, false, self, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
			a.dispatchEvent(ev);
			delete a;
		}
	}

	function getHTMLForSave() {
		var wrapperScrollTop = document.getElementById("wrapper").scrollTop;
		var previewerScrollTop = document.getElementById("previewer").scrollTop;
		
		// アップデート用のscriptタグを消す
		document.querySelector("#updateScriptArea").innerHTML = "";
		
		// テキストエリアは値を入れなおさないと保存されない。
		var editor = document.getElementById("editor");
		editor.innerHTML = editor.value.replace(/</g, "&lt;");
		
		var cssEditor = document.getElementById("cssEditor");
		cssEditor.innerHTML = cssEditor.value;
		
		var toggleFlag = ktm.isEditMode();
		if (toggleFlag == true) {
			ktm.toggleMode();
		}
		addClass(document.querySelector("body"), "initialState");
		
		/* ファイルの肥大化を防ぐため中身を消去 */
		document.getElementById("previewer").innerHTML = "";
		document.getElementById("messageArea").innerHTML = "";
		document.getElementById("previewerStyle").innerHTML="";
		
		// 不要なdiffの原因となるスタイルなどを削除
		if (document.title.match(/^\* .*/)) {
			document.title = document.title.substr("\* ".length);
		}
		
		var stylees = document.querySelectorAll("*[style]");
		for (var i = 0; i < stylees.length; i++) {
			var stylee = stylees[i];
			stylee.removeAttribute("style");
		}
		
		document.querySelector("#previewer").removeAttribute("class");
		
		// HTML生成
		var html = "<!doctype html>\n<html>\n";
		html += document.getElementsByTagName("html")[0].innerHTML;
		var i = html.lastIndexOf("/script>"); // bug fix #1 #39
		html = html.substring(0, i);
		html += "/script>\n</body>\n</html>";
		
		contentAtSave = editor.value;
		saved = true;
		ktm.doPreview();
		
		removeClass(document.querySelector("body"), "initialState");
		if (toggleFlag == true) {
			ktm.toggleMode();
		}
		
		document.getElementById("previewer").scrollTop = previewerScrollTop;
		document.getElementById("wrapper").scrollTop = wrapperScrollTop;
		return html;
	}

	/* 更新時、終了時の警告 */
	var saved = true;
	window.onbeforeunload = function() {
		if (!saved) {
			return "ドキュメントが保存されていません。"
		}
	}

	on("#editor", "input", ktm.updateSavedFlag);
	
	prototype.updateSavedFlag = function() {
		if (contentAtSave == document.getElementById("editor").value) {
			saved = true;
		} else {
			saved = false;
		}
	}

})(prototype, ktm);