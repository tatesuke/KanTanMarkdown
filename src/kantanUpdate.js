kantanUpdate({
	"newVersion": <inline src="kantanVersion.js" /> + "hoge",
	"ktmString": <inline src="ktmString.js" />,
	"doUpdate": function() {
		console.log(kantanVersion + " " + this.newVersion);
		if (kantanVersion == this.newVersion) {
			alert("お使いのKantanMarkdownは最新です。アップデートの必要はありません。");
			return;
		}
		
		showImportDialog("hogehoge?", (function (parent) {
			return function(result) {
				if (result.result == true) {
					parent.rewirteHtml(result);
				}
			}
		})(this));
	},
	"rewirteHtml":function(dialogResult) {
		// アップデート前の値を記憶しておく
		var fileListElement = document.querySelector("ul#fileList");
		var originalMarkdown = document.querySelector("textarea#editor").value;

		// メモリリーク対策のためにイベントをすべて消す。
		removeAllEvents();
		
		// liteバージョンではhljsのcssを消す
		var newHtml = this.ktmString;
		if (kantanEdition == "lite") {
			newHtml = newHtml.replace(/\/\* START_HLJS_CSS \*\/[\s|\S]+\/\* END_HLJS_CSS \*\//, "");
		}
		
		// 本体をアップデート
		var html = document.querySelector("html");
		html.innerHTML = newHtml;
		
		// innerHTMLではscriptタグが実行されないのでいったん外して付け直す
		var scriptElements = document.querySelectorAll("script");
		for (var i = 0; i < scriptElements.length; i++) {
			var scriptElement = scriptElements[i];
			var parentNode = scriptElement.parentNode;
			parentNode.removeChild(scriptElement);
		}
		for (var i = 0; i < scriptElements.length; i++) {
			var scriptElement = scriptElements[i];
			if (kantanEdition == "lite" &&
					(  (scriptElement.id == "highlightJs")
					|| (scriptElement.id == "raphaelJs")
					|| (scriptElement.id == "underscoreJs")
					|| (scriptElement.id == "jsSequenceDiagramsJs")
					|| (scriptElement.id == "flowchartJs") )) {
				continue;
			} else if (kantanEdition == "std" && 
					(  (scriptElement.id == "raphaelJs")
					|| (scriptElement.id == "underscoreJs")
					|| (scriptElement.id == "jsSequenceDiagramsJs")
					|| (scriptElement.id == "flowchartJs") )) {
				continue;
			}
			var newScript = document.createElement("script");
			newScript.id = scriptElement.id;
			newScript.innerHTML = scriptElement.innerHTML;
			
			document.querySelector("body").appendChild(newScript);
		}
		
		// バージョン更新
		kantanVersion = this.newVersion;
		updateVersion();
		
		// 添付ファイル引継ぎ
		if (dialogResult.attach == true) {
			var fileList = document.getElementById("fileList");
			var importScripts = fileListElement.querySelectorAll("script");
			for (var i = 0; i < importScripts.length; i++) {
				var scriptElement = importScripts[i];
				var fileName = scriptElement.title;
				var content = scriptElement.innerHTML;
				addAttachFileElements(fileName, content);
			}
			saved = false;
		}
		
		// Markdown引継ぎ
		if (dialogResult.markdown == true) {
			var editor = document.getElementById("editor");
			editor.value = originalMarkdown;
			saved = false;
		}
		
		// 念のため古いエレメントを削除しておく
		fileListElement = null;
		
		// プレビュー
		doPreview();
	},
});