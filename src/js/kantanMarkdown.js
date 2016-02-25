(function() {
	/* 編集不可ブラウザ判定 */

	// Blobが使用できないブラウザは保存不可(IE9等)
	try {
		new Blob(["temp"]);
	} catch(e) {
		setViewMode(); 
	}

	// Safariはdownload属性に対応していないので閲覧のみ
	var ua = window.navigator.userAgent.toLowerCase();
	if ((ua.indexOf("chrome") == -1) && (ua.indexOf('safari') != -1)) {
		setViewMode();
	}

	function setViewMode() {
		document.getElementById("messageArea").innerText
				 = "このブラウザでは編集できません。";
		var navElems = document.querySelectorAll("nav > *");
		for (var i = 0; i < navElems.length; i++) {
			navElems[i].setAttribute("disabled", "disabled");
		}
	}

	/* バージョン埋め込み */
	var versionElements = document.getElementsByClassName("version");
	for (var i = 0 ; i < versionElements.length; i++) {
		versionElements[i].innerText = kantanVersion;
	}

	/* エディタに機能追加 */
	toKantanEditor(document.getElementById("editor"));

	/* シンタックスハイライト設定 */
	if (typeof hljs !== "undefined") {
		marked.setOptions({
			highlight: function (code, lang) {
				return hljs.highlightAuto(code, [lang]).value;
			}
		});
	}

	/* 起動時にコンテンツ読み込み */
	if (isEnable(document.getElementById("toggleButton")) 
			&& (document.getElementById("editor").innerHTML == "")) {
		// 編集モードでなく、内容が空であれば初期状態を編集モードにする
		toggleMode();
	} else {
		doPreview();
	}

	/* レイアウト調整 */
	doLayout();
	window.addEventListener("resize", doLayout);
	function doLayout() {
		var editor = document.getElementById("editor");
		var previewer = document.getElementById("previewer");
		var wrapper = document.getElementById("wrapper");
		
		var height = window.innerHeight - wrapper.offsetTop - 10;
		wrapper.style.height = height + "px";
		
		if (isVisible(editor)) {
			previewer.style.width = "50%";
			previewer.style.height = "100%";
		} else {
			previewer.style.width = "980px";
			previewer.style.height = "";
		}
	}

	/* 編集・閲覧切り替え */
	var editorScrollBarPos = 0;
	var caretStartPos = 0;
	var caretEndPos = 0;
	var isPreviewerOpened = true;
	document.getElementById("toggleButton").addEventListener("click", toggleMode);

	function toggleMode() {
		var attach = document.getElementById("attach");
		var editor = document.getElementById("editor");
		var previewer = document.getElementById("previewer");
		if (isVisible(editor)) {
			editorScrollBarPos    = editor.scrollTop;
			caretStartPos = editor.selectionStart;
			caretEndPos = editor.selectionEnd;
		}

		if (isVisible(editor)) {
			// プレビューモードへ
			isPreviewerOpened = isVisible(previewer);
			if (isPreviewerOpened == false) {
				openPreview();
			}
			
			hide(attach);
			hide(editor);
			doPreview();
			
			// スクロールバー位置記憶
			var minDiff = null;
			var minElem = null;
			var elems = previewer.querySelectorAll("*");
			for (var i = 0; i < elems.length; i++) {
				var diff = previewer.scrollTop - (elems[i].offsetTop - previewer.offsetTop);
				if ((minDiff == null) || (Math.abs(diff) < Math.abs(minDiff))) {
					minDiff = diff;
					minElem = elems[i];
				}
			}	
			
			// レイアウト修正
			doLayout();
			
			previewer.focus();
			
			if (minElem) {
				wrapper.scrollTop = (minElem.offsetTop - previewer.offsetTop) + minDiff;
			}
		} else {
			// 編集モードへ
			showBlock(attach);
			showBlock(editor);
			doPreview();
			
			// スクロールバー位置記憶
			var minDiff = null;
			var minElem = null;
			var elems = previewer.querySelectorAll("*");
			for (var i = 0; i < elems.length; i++) {
				var diff = wrapper.scrollTop - (elems[i].offsetTop - previewer.offsetTop);
				if ((minDiff == null) || (Math.abs(diff) < Math.abs(minDiff))) {
					minDiff = diff;
					minElem = elems[i];
				}
			}		
			
			if (isPreviewerOpened == false) {
				closePreview();
			}
			
			// レイアウト修正
			doLayout();
			
			if (minElem) {
				previewer.scrollTop = (minElem.offsetTop - previewer.offsetTop) + minDiff;
			}
		}
		

		if (isVisible(editor)) {
			editor.scrollTop    = editorScrollBarPos;
			editor.selectionStart = caretStartPos;
			editor.selectionEnd = caretEndPos;
			editor.focus();
		}
	}

	/* エディタとプレビューの同期 */

	// 自動同期チェックボックスをクリックしたらchecked属性を更新する
	// これを行わないと自動同期チェックボックスの状態が保存されない
	document.getElementById("autoSyncButton").addEventListener("change", function() {
		if (this.checked == true) {
			this.setAttribute("checked", "checked");
		} else {
			this.removeAttribute("checked");
		}
	});

	//更新ボタンを押したら更新する 
	document.getElementById("syncButton").addEventListener("click", doPreview);

	// エディタに変化があったらプレビュー予約
	document.getElementById("editor").addEventListener("change", queuePreview);
	document.getElementById("editor").addEventListener("keyup", queuePreview);

	// 自動更新がONならプレビューする
	// ただし、onkeyupなど呼ばれる頻度が高いので一定時間待って最後の呼び出しのみ実行する
	var previewQueue = null; // キューをストック 
	var queuePreviewWait = 300; // 0.3秒後に実行の場合 
	function queuePreview() {
		var autoSyncButton = document.getElementById("autoSyncButton");
		if (!autoSyncButton.checked) {
			return;
		}

		// イベント発生の都度、キューをキャンセル 
		clearTimeout( previewQueue );
		 
		// waitで指定したミリ秒後に所定の処理を実行 
		// 経過前に再度イベントが発生した場合
		// キューをキャンセルして再カウント 
		previewQueue = setTimeout(doPreview, queuePreviewWait);
	}


	// 同期実行
	function doPreview() {	
		// スクロールバー下端判定
		var scrollLockFlag = isMaxScroll("previewer");
		
		// マークダウンレンダリング
		var previewer = document.getElementById("previewer");
		previewer.innerHTML = marked(editor.value);
		
		// タイトル変更
		var h1 = document.querySelector("h1");
		if(h1) {
			document.title = h1.textContent;
		} else {
			document.title = "無題";
		}
		if (saved == false) {
			document.title = "* " + document.title;
		}
		
		// 画像埋め込み
		var images = document.getElementsByTagName("img");
		for (i in images) {
			var elem = images[i];
			var img = document.getElementById("attach-" + elem.name);
			if (img != null) {
				elem.src = img.innerHTML;
			}
		}
		
		// シーケンス図
		if (typeof Diagram !== "undefined") {
			var sequences = document.getElementsByClassName("sequence");
			for (var i = 0; i < sequences.length; i++) {
				var sequence = sequences[i];
				var diagram = Diagram.parse(sequence.textContent);
				sequence.innerHTML = "";
				diagram.drawSVG(sequence, {theme: 'simple'});
			}
		}
		
		// フローチャート
		if (typeof flowchart !== "undefined") {
			var flows = document.getElementsByClassName("flow");
			for (var i = 0; i < flows.length; i++) {
				var flow = flows[i];
				var diagram = flowchart.parse(flow.textContent);
				flow.innerHTML = "";
				diagram.drawSVG(flow);
			}
		}
		
		// IEだとinnerHTML後にborderが消えてしまい
		// スクロールバーの位置がおかしくなる。
		// なのでここで特別にこの行を書いてやらないといけない
		previewer.style.border = "1px solid gray";
		
		// スクロールバーが最下部にある場合、更新後も最下部にする。
		if (scrollLockFlag == true) {
			previewer.scrollTop = previewer.scrollHeight;
		}
		
		// previewedイベントをディスパッチ
		var event = document.createEvent("Event");
		event.initEvent("previewed", true, true);
		previewer.dispatchEvent(event);
	}

	function isMaxScroll (id) {
		var elem = document.getElementById(id);
		
		var scrollHeight = elem.scrollHeight;
		var clientHeight = elem.clientHeight;
		var scrollTop = elem.scrollTop;
		var diff = scrollHeight - (clientHeight + scrollTop)
		
		// 小数点付きの計算なので数ピクセルの誤差を許容する
		return (-1.0 <= diff) && (diff <= 1.0);
	}

	/* ファイル添付 */
	document.getElementById("attachButton").addEventListener("change", function(e) {
		var elem = e.target;
	    var files = elem.files;
	    attachFiles(files);
	});
	document.getElementsByTagName("body")[0].addEventListener("dragover", function(e) {
		e.stopPropagation();
		e.preventDefault();
		e.dataTransfer.dropEffect = 'copy';
		this.classList.add('onDragover');
	});
	document.getElementsByTagName("body")[0].addEventListener("drop", function(e) {
		e.stopPropagation();
		e.preventDefault();
		attachFiles(e.dataTransfer.files);
		this.classList.remove("onDragover");
	});
	document.getElementsByTagName("body")[0].addEventListener("dragleave", function(e){
		this.classList.remove("onDragover");
	});

	function attachFiles(files){
		for (var i = 0; i < files.length; i++) {
			var file = files[i];
			var type = files[i].type;
			if (type == "text/html") {
				attachHtmlFile(file)
			} else {
				attachFile(file);
			}
		}
	}
	
	function attachFile(file) {
		var fr = new FileReader();
	    fr.fileName = file.name;
	    fr.onload = function(e) {
			var target = e.target;
			addAttachFileElements(target.fileName, target.result);
		};
		fr.readAsDataURL(file);
	}
	
	function attachHtmlFile(file) {
		var fr = new FileReader();
		fr.fileName = file.name;
		fr.onload = (function (file) {
			return function(e) {
				// <html></html>の中身だけ取り出し疑似的にdomを作る
				var result = e.target.result;
				var innerHtml = result.substring(23, result.length - 8);
				var dummyHtml = document.createElement("html");
				dummyHtml.innerHTML = innerHtml;
				
				// 簡単HTMLの構造か調べる
				var importFlag = false;
				var fileListElement = dummyHtml.querySelector("ul#fileList");
				var editorElement = dummyHtml.querySelector("textarea#editor");
				if (fileListElement && editorElement) {
					showImportDialog(
							"かんたんMarkdownのファイルを検出しました。どの項目をインポートしますか？\n" + 
							"インポートする場合、項目は末尾に挿入されます", function(result){
						if (result.result == true) {
							importKantanMarkdown(result, dummyHtml, file);
						} else {
							attachFile(file);
						}
					});
					
				} else {
					attachFile(file);
				}
			}
		})(file);
		fr.readAsText(file)
	}
	
	function importKantanMarkdown(result, dummyHtml, file) {
		if (result.attach == true) {
			var fileListElement = dummyHtml.querySelector("ul#fileList");
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
		
		if (result.markdown == true) {
			var editorElement = dummyHtml.querySelector("textarea#editor")
			var editor = document.getElementById("editor");
			editor.value = editor.textContent + editorElement.textContent;
			saved = false;
		}
		
		doPreview();
	} 
	
	function showImportDialog(msg, callback) {
		document.getElementById("saveButton").disabled =  true;
		document.getElementById("importDialogMessage").innerText = msg;
		var dialogElement = document.getElementById("importDialog");
		dialogElement.querySelector("form").reset();
		
		document.getElementById("importDialogOkButton").onclick = function(e){
			e.preventDefault();
			hide(dialogElement = document.getElementById("importDialog"));
			
			var result = {
				result: true,
				attach: document.getElementById("importDialogAttach").checked,
				markdown:document.getElementById("importDialogMarkdown").checked,
				css:false
			}
			callback(result);
			
			delete document.getElementById("importDialogOkButton").onclick;
			delete document.getElementById("importDialogCancelButton").onclick;
			document.getElementById("saveButton").disabled =  false;
			
			return false;
		};
		
		
		document.getElementById("importDialogCancelButton").onclick = function(e) {
			e.preventDefault();
			hide(dialogElement = document.getElementById("importDialog"));
			
			callback({result:false});
			
			delete document.getElementById("importDialogOkButton").onclick;
			delete document.getElementById("importDialogCancelButton").onclick;
			document.getElementById("saveButton").disabled =  false;
			
			return false;
		}
		
		showBlock(dialogElement);
		
		var body = document.querySelector("body");
		dialogElement.style.top = "10px";
		dialogElement.style.left = ((body.offsetWidth / 2.0) - (dialogElement.offsetWidth / 2.0)) + "px";
	}

	function addAttachFileElements(fileName, content) {
		var li = document.createElement("li");

		var script = document.createElement("script");
		script.type  = "text/template";
		script.id    = "attach-" + fileName;
		script.title = fileName;
		script.innerHTML = content;
		li.appendChild(script);

		var input  = document.createElement("input");
		input.type = "text";
		input.classList.add('fileName');
		input.value = fileName;
		input.addEventListener("change", onFileNameChanged);
		li.appendChild(input);

		var detachButton = document.createElement("button");
		detachButton.classList.add('detachButton');
		detachButton.innerHTML = "×";
		detachButton.addEventListener("click", onDetachButtonClicked);
		li.appendChild(detachButton);

		document.getElementById("fileList").appendChild(li);
		
		// ファイル添付領域を開く
		var editor = document.getElementById("editor");
		var toggleButton = document.getElementById("toggleButton");
		var filer = document.getElementById("filer");
		if (!isVisible(editor)) {
			toggleButton.click();
		}
		if (!isVisible(filer)) {
			openFiler();
		}
		
		queuePreview();
	}

	/* ファイル削除 */
	var onDetachButtonClicked = function(e) {
		// 削除ボタンが押されたら親要素(li)ごと削除
		if(window.confirm('削除していいですか?')){
			var parent = e.target.parentNode;
			parent.parentNode.removeChild(parent);
			saved = false;
		}
	}

	/* ファイル名変更 */
	var fileNameElems = document.getElementsByClassName("fileName");
	for (var i = 0; i < fileNameElems.length; i++) {
		// なぜかvale属性の変更が保存されないので起動時に引っ張ってきてやる
		var fileNameElem = fileNameElems[i];
		var fileName = fileNameElem.previousElementSibling.getAttribute("title");
		fileNameElem.value = fileName;
	}

	var onFileNameChanged = function(e) {
		var target = e.target;
		if (target.value.trim() == "") {
			alert("名前は必ず入力してください");
			target.focus();
		} else {
			var scriptTag = target.previousElementSibling;
			scriptTag.id =  "attach-" + target.value;
			scriptTag.title = target.value;
			saved = false;
			queuePreview();
		}
	}

	/* 添付ファイル領域開け閉め */
	document.getElementById("attachToggleButton")
			.addEventListener("click", function() {
		if (isVisible(document.getElementById("filer"))){
			closeFiler();
		} else {
			openFiler();
		}
	});

	/* プレビュー領域開け閉め */
	document.getElementById("previewToggleButton")
			.addEventListener("click", function() {
		if (isVisible(document.getElementById("previewer"))){
			closePreview();
		} else {
			openPreview();
		}
	});

	function openFiler() {
		document.getElementById("attachToggleButton").innerText = "添付ファイルを隠す(Alt+↑)";
		showBlock(document.getElementById("attachForm"));
		showBlock(document.getElementById("filer"));
		doLayout();
	}

	function closeFiler() {
		document.getElementById("attachToggleButton").innerText = "添付ファイルを表示(Alt+↓)";
		hide(document.getElementById("attachForm"));
		hide(document.getElementById("filer"));
		doLayout();
	}

	function openPreview() {
		// エディタサイズに相対値を利用しているためプレビュー表示されていない場合のみ実行
		// 閲覧モード時は実行しない
		var editor = document.getElementById("editor");
		var previewer = document.getElementById("previewer");
		if (isVisible(editor) && !isVisible(previewer)) {
			document.getElementById("previewToggleButton").innerText = "プレビューを隠す(Alt+→)";
			editor.style.width = "50%";
			showBlock(previewer);
			doLayout();
		}
	}

	function closePreview() {
		// エディタサイズに相対値を利用しているためプレビュー表示されている場合のみ実行
		// 閲覧モード時は実行しない
		var editor = document.getElementById("editor");
		var previewer = document.getElementById("previewer");
		if (isVisible(editor) && isVisible(previewer)) {
			document.getElementById("previewToggleButton").innerText = "プレビューを表示(Alt+←)";
			editor.style.width = "100%";
			hide(previewer);
			doLayout();
		}
	}

	/* 保存 */
	var contentAtSave = editor.value;
	document.getElementById("saveButton").addEventListener("click", save);
	function save() {
		var wrapperScrollTop = document.getElementById("wrapper").scrollTop;
		var previewerScrollTop = document.getElementById("previewer").scrollTop;
		
		// テキストエリアは値を入れなおさないと保存されない。
		var editor = document.getElementById("editor");
		editor.innerHTML = editor.value.replace(/</g, "&lt;");
		
		var toggleFlag = isVisible(editor);
		if (toggleFlag == true) {
			toggleMode();
		}
		
		/* ファイルの肥大化を防ぐため中身を消去 */
		document.getElementById("previewer").innerHTML = "";
		document.getElementById("messageArea").innerHTML = "";
		
		var html = "<!doctype html>\n<html>\n";
		html += document.getElementsByTagName("html")[0].innerHTML;
		var i = html.lastIndexOf("/script>"); // bug fix #1 #39
		html = html.substring(0, i);
		html += "/script>\n</body>\n</html>";

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
		
		contentAtSave = editor.value;
		saved = true;
		doPreview();
		if (toggleFlag == true) {
			toggleMode();
		}
		
		document.getElementById("previewer").scrollTop = previewerScrollTop;
		document.getElementById("wrapper").scrollTop = wrapperScrollTop;
	}

	/* 更新時、終了時の警告 */
	var saved = true;
	window.onbeforeunload = function() {
		if (!saved) {
			return "ドキュメントが保存されていません。"
		}
	}

	document.getElementById("editor").addEventListener("input", updateSavedFlag);

	function updateSavedFlag() {
		if (contentAtSave == document.getElementById("editor").value) {
			saved = true;
		} else {
			saved = false;
		}
	}

	/* オンラインメニュー */
	document.getElementById("onlineMenuButton").addEventListener("click", function(){
		var button = this;
		var onlineMenu = document.getElementById("onlineMenu");
		onlineMenu.style.top = (this.offsetTop + this.scrollHeight) + "px";
		showBlock(onlineMenu);
	});

	window.addEventListener("click", function(e){
		var onlineMenuButton = document.getElementById("onlineMenuButton");
		if (e.target != onlineMenuButton) {
			hide(document.getElementById("onlineMenu"));
		}
	});

	/* 見出し同期 */
	document.getElementById("headingSyncButton")
			.addEventListener("click", headingSyncToPreviewer);

	document.getElementById("previewer").addEventListener("previewed", function(e) {
		if (isVisible(document.getElementById("editor"))) {
			var headings = e.target.querySelectorAll("h1, h2, h3, h4, h5, h6");
			for (var i = 0; i < headings.length; i++) {
				headings[i].addEventListener("mouseover", function(){
					this.style.cursor = "pointer";
				});
				headings[i].addEventListener("click", headingSyncToEditor);
			}
		}
	});

	function headingSyncToPreviewer() {
		var editor = document.getElementById("editor");
		var previewer = document.getElementById("previewer");
		
		var num = getCurrentNumberOfHeading(editor);
		scrollPreviewerToHeading(previewer, num);
	}

	function headingSyncToEditor(e) {
		var editor = document.getElementById("editor");
		var previewer = document.getElementById("previewer");
		var num = getNumberOfHeading(previewer, e.target);
		scrollEditorToHeading(editor, num);
	}

	function getNumberOfHeading(previewer, elem) {
		var headings = previewer.querySelectorAll("h1, h2, h3, h4, h5, h6");
		var i;
		for (i = 0; i < headings.length; i++) {
			if (headings[i] == elem) {
				break;
			}
		}
		return i + 1;
	}

	function scrollEditorToHeading(editor, num) {
		var value = editor.value;
		var processedLines = processForHeadingSync(value, value.length);

		
		var headingCount = 0;
		var i;
		for (var i = 0; i < processedLines.length; i++) {
			var line = processedLines[i];
			if (line.match(/^# .+$/)) {
				headingCount++;
				
				if (headingCount == num) {
					break;
				}
			}
		}
		
		var j = 0;
		if (i != 0) {
			var lineBreakCount = 0;
			for (j = 0; j < value.length ; j++) {
				var c = value.charAt(j);
				if (c == "\n") {
					lineBreakCount++;
					if (lineBreakCount == i) {
						j++;
						break;
					}
				}
			}
		}
		
		var end = editor.value.indexOf("\n", j);
		end = (end == -1) ? editor.value.length : end;
		
		editor.selectionStart = j;
		editor.selectionEnd = end;
		updateScrollPos(editor);
		// chromeだとupdateScrollPosのバグで強制的にsaved=trueになってしまう
		// そのため、updateSavedFlagを呼び出して元に戻す。
		// TODO いつか治したい
		updateSavedFlag();
		editor.focus();
	}

	function getCurrentNumberOfHeading(editor) {
		var value = editor.value;
		
		// ==や--によるheadingに対応するため
		// キャレットの次の行まで読み込む
		var length = editor.selectionStart;
		var lineBreakCount = 0;
		while ((length < value.length) && (lineBreakCount < 2)) {
			if (value.charAt(length) == "\n") {
				lineBreakCount++;
			}
			length++;
		}
		length--;
		
		var processed = processForHeadingSync(value, length);
		if ((lineBreakCount == 2)
				&& processed[processed.length - 1].match(/^#{1,6}\s(.+)$/)) {
			// キャレットの次の行がheadingだったらそれは捨てる
			processed.pop();
		}
		return processed.join().split("# ").length - 1;
	}

	function scrollPreviewerToHeading(previewer, numberOfHeading) {
		if (numberOfHeading == 0) {
			previewer.scrollTop = 0;
		} else {
			var hElems = previewer.querySelectorAll("h1, h2, h3, h4, h5, h6");
			var elem = hElems[numberOfHeading - 1];
			previewer.scrollTop = elem.offsetTop - previewer.offsetTop;
		}
	}

	function processForHeadingSync(str, length) {
		var text = str.substring(0, length);
		var lines = text.split("\n");
		var newLines = [];
		
		var style = editor.currentStyle 
				|| document.defaultView.getComputedStyle(editor, '');
		var tabSize = style.tabSize
					|| style.MozTabSize
					|| 8;
		tabSize = Number(tabSize);
		
		var tildeCodeBlockFlag = false;
		var backQuoteCodeBlockFlag = false;
		var i;
		for (i = 0; i < lines.length; i++) {
			var line = lines[i];
			// 行頭にtabSize以上のスペースがある行は削除
			line = line.replace(new RegExp("^ {" + tabSize + ",}.*"), "");
			// 行頭にtabがある行は削除
			line = line.replace(/^\t+.*/, "");
			// trim
			line = line.replace(/^\s+|\s+$/g, "");
			
			if (tildeCodeBlockFlag == true) {
				if (line == "~~~") {
					tildeCodeBlockFlag = false;
				}
				newLines.push("");
				continue;
			}
			if (backQuoteCodeBlockFlag == true) {
				if (line == "```") {
					backQuoteCodeBlockFlag = false;
				}
				newLines.push("");
				continue;
			}
			
			if (line.substring(0, 3) == "~~~"){
				tildeCodeBlockFlag = true;
				newLines.push("");
				continue;
			}
			if (line.substring(0, 3) == "```"){
				backQuoteCodeBlockFlag = true;
				newLines.push("");
				continue;
			}
			
			if (line.match(/^={2,}$|^-{2,}$/)
					&& !newLines[i - 1].match(/^#{1,6}\s(.+)$/)
					&& (newLines[i - 1] != "")) {
				newLines[i - 1] = "# " + newLines[i - 1];
				newLines.push("");
				continue;
			}
			if (line.match(/^#{1,6}\s(.+)$/)) {
				newLines.push("# " + RegExp.$1);
				continue;
			}
			
			newLines.push(line.replace(/#/g, ""));
		}

		return newLines;
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

	/* ショートカットキー */
	window.addEventListener("keydown", function(event) {
		var code = (event.keyCode ? event.keyCode : event.which);
		
		if (code == 27) {
			// ESCキー
			event.preventDefault();
			
			var onlineMenu = document.getElementById("onlineMenu");
			if (isVisible(onlineMenu)) {
				// オンラインメニュー閉じる
				hide(onlineMenu);
			} else {
				// 閲覧/編集モード切り替え
				var toggleButton = document.getElementById("toggleButton");
				if (isEnable(toggleButton)) {
					toggleButton.click();
				}
			}
			return false;
		}
		
		
		if (code == 83 && (event.ctrlKey || event.metaKey)){
			// CTRL+Sで保存する
			event.preventDefault();
			
			var saveButton = document.getElementById("saveButton");
			if (isEnable(saveButton)) {
				saveButton.click();
			}
			return false;
		}
		
		if (code == 116 ||
				((code == 82) && (event.ctrlKey || event.metaKey))){
			// F5 or Ctrl + Rでエディタとプレビューアを同期
			event.preventDefault();
			
			var syncButton = document.getElementById("syncButton");
			if (isEnable(syncButton)) {
				doPreview();
			}
			return false;
		}
		
		if (code == 112){
			// F1でヘルプ
			event.preventDefault();
			
			var helpButton = document.getElementById("helpButton");
			helpButton.click();
			
			return false;
		}

		if ((code == 37) && event.altKey) {
			// Alt+←
			event.preventDefault();
			openPreview();
			return false;
		}

		if ((code == 38) && event.altKey) {
			// Alt+↑
			event.preventDefault();
			closeFiler();
			return false;
		}

		if ((code == 39) && event.altKey) {
			// Alt+→
			event.preventDefault();
			closePreview();
			return false;
		}
		
		if ((code == 40) && event.altKey) {
			// Alt+↓
			event.preventDefault();
			openFiler();
			return false;
		}
		
		if (code == 113) {
			// F2で見出し同期（エディタ→プレビューア）
			event.preventDefault();
			
			var headingSyncButton = document.getElementById("headingSyncButton");
			headingSyncButton.click();
			
			return false;
		}
		
		return true;
	});

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
		elem.style.display = "block";
	}

	function hide(elem) {
		elem.style.display = "none";
	}
})();