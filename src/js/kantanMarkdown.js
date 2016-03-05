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
    
	/* 編集不可ブラウザ判定 */

	// Blobが使用できないブラウザは保存不可(IE9等)
	try {
		new Blob(["temp"]);
	} catch(e) {
		setViewOnly(); 
	}

	// Safariはdownload属性に対応していないので閲覧のみ
	var ua = window.navigator.userAgent.toLowerCase();
	if ((ua.indexOf("chrome") == -1) && (ua.indexOf('safari') != -1)) {
		setViewOnly();
	}

	function setViewOnly() {
		document.getElementById("messageArea").innerText
				 = "このブラウザでは編集できません。";
		var navElems = document.querySelectorAll("nav > *");
		for (var i = 0; i < navElems.length; i++) {
			navElems[i].setAttribute("disabled", "disabled");
		}
	}

	/* アップデート */
    updateKantanVersion(document.getElementById("kantanVersion").value);
	
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

	function updateKantanVersion (version) {
		document.getElementById("kantanVersion").value = version;
		var edition = document.getElementById("kantanEdition").value;
		var versionElements = document.getElementsByClassName("version");
		for (var i = 0 ; i < versionElements.length; i++) {
			versionElements[i].innerText = version + "_" + edition;
		}
	}
	
	function updateKantanEdition (edition) {
		document.getElementById("kantanEdition").value = edition;
	}
	
	function kantanUpdate(json) {
		json.doUpdate();
	}
	
	on("#updateButton", "click", function(event) {
		event.preventDefault();
		
		if(!window.confirm(
				"最新版にアップデートします。\n" +
				"不測の事態に備えて、現在編集中のドキュメントは保存しておくことをお勧めします。\n" + 
				"\n" + 
				"【OK】：アップデート実行(あと何回かダイアログが表示されます)\n" + 
				"【キャンセル】：キャンセル")){
			return false;
		}
		
		var script = document.createElement("script");
		script.src = "http://tatesuke.github.io/KanTanMarkdown/kantanUpdate.js";
		//script.src = "http://localhost:3000/kantanUpdate.js";
		script.class = "kantanUpdateScript";
		script.onerror = function () {
			alert("アップデートに失敗しました。\n" + 
			"アップデート用のファイルにアクセスできませんでした。\n" + 
			"インターネットに接続されていないか、サーバーダウンです");
		};
		document.querySelector("#updateScriptArea").appendChild(script);
		
		return false;
	})

	/* エディタに機能追加 */
	toKantanEditor(document.getElementById("editor"));
	
	document.querySelector("#cssEditor").value = 
			document.querySelector("#previewerStyle").innerHTML.trim();
	document.querySelector("#cssEditor").selectionStart = 0;
	document.querySelector("#cssEditor").selectionEnd = 0;
	toKantanEditor(document.getElementById("cssEditor"));

	/* シンタックスハイライト設定 */
	if (typeof hljs !== "undefined") {
		marked.setOptions({
			highlight: function (code, lang) {
				return hljs.highlightAuto(code, [lang]).value;
			}
		});
	}
	
	/* 起動時にコンテンツ読み込み */
	document.querySelector("body").classList.add("previewMode");
	document.querySelector("body").classList.remove("editMode");
	if (isEnable(document.getElementById("toggleButton")) 
			&& (document.getElementById("editor").innerHTML == "")) {
		// 編集モードでなく、内容が空であれば初期状態を編集モードにする
		toggleMode();
	} else {
		doPreview();
	}

	/* レイアウト調整 */
	doLayout();
	on(window, "resize", doLayout);
	function doLayout() {
		var wrapper = document.getElementById("wrapper");
		
		var wrapperHeight = window.innerHeight - wrapper.offsetTop - 10;
		wrapper.style.height = wrapperHeight + "px";
	}

	/* 編集・閲覧切り替え */
	var editorScrollBarPos = 0;
	var caretStartPos = 0;
	var caretEndPos = 0;
	var isPreviewerOpened = true;
	on("#toggleButton", "click", toggleMode);

	function toggleMode() {
		var attach = document.getElementById("attach");
		var editorTabWrapper = document.getElementById("editorTabWrapper");
		var editor = document.getElementById("editor");
		var previewer = document.getElementById("previewer");
		if (isEditMode()) {
			editorScrollBarPos    = editor.scrollTop;
			caretStartPos = editor.selectionStart;
			caretEndPos = editor.selectionEnd;
		}

		if (isEditMode()) {
			// プレビューモードへ
			isPreviewerOpened = isVisible(previewer);
			if (isPreviewerOpened == false) {
				openPreview();
			}
			
			hide(attach);
			hide(editorTabWrapper);
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
			document.querySelector("body").classList.add("previewMode");
			document.querySelector("body").classList.remove("editMode");
			doLayout();
			
			previewer.focus();
			
			if (minElem) {
				wrapper.scrollTop = (minElem.offsetTop - previewer.offsetTop) + minDiff;
			}
		} else {
			// 編集モードへ
			showBlock(attach);
			showBlock(editorTabWrapper);
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
			document.querySelector("body").classList.remove("previewMode");
			document.querySelector("body").classList.add("editMode");
			doLayout();
			
			if (minElem) {
				previewer.scrollTop = (minElem.offsetTop - previewer.offsetTop) + minDiff;
			}
		}
		

		if (isEditMode()) {
			editor.scrollTop    = editorScrollBarPos;
			editor.selectionStart = caretStartPos;
			editor.selectionEnd = caretEndPos;
			editor.focus();
		}
	}

	/* Markdownエディタとプレビューの同期 */

	// 自動同期チェックボックスをクリックしたらchecked属性を更新する
	// これを行わないと自動同期チェックボックスの状態が保存されない
	on("#autoSyncButton", "change", function() {
		if (this.checked == true) {
			this.setAttribute("checked", "checked");
		} else {
			this.removeAttribute("checked");
		}
	});

	//更新ボタンを押したら更新する 
	on("#syncButton", "click", doPreview);

	// エディタに変化があったらプレビュー予約
	on("#editor", "change", queuePreview);
	on("#editor", "keyup", queuePreview);
	
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
		// prepreviewedイベントをディスパッチ
		var previewer = document.getElementById("previewer");
		var event = document.createEvent("Event");
		event.initEvent("prepreview", true, true);
		previewer.dispatchEvent(event);

		// スクロールバー下端判定
		var scrollLockFlag = isMaxScroll("previewer");
		
		// マークダウンレンダリング
		previewer.innerHTML = marked(editor.value);
		
		// CSS修正
		var previewerStyle = document.querySelector("#previewerStyle");
		var cssEditor = document.querySelector("#cssEditor");
		previewerStyle.innerHTML = cssEditor.value;
		
		
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
		var images = document.querySelectorAll("#previewer img");
		for (i in images) {
			var elem = images[i];
			var base64 = null;
			if (elem.name) {
				var script = document.getElementById("attach-" + elem.name);
				if (script) {
					base64 = script.innerHTML;
				}
			}
			if (!base64 && elem.src) {
				var matchs = elem.src.trim().match(/^attach:(.+)/);
				if (matchs) {
					var script = document.getElementById("attach-" + matchs[1]);
					if (script) {
						base64 = script.innerHTML;
					}
				}
			}
			if (base64 != null) {
				elem.src = base64;
			}
		}
		
		// リンク
		var anchors = document.querySelectorAll("#previewer a");
		for(i in anchors) {
			var anchor = anchors[i];
			var href = anchor.href;
			if (href) {
				var matchs = href.trim().match(/^attach:(.+)/);
				if (matchs) {
					var name = matchs[1];
					var blob = getBlob(name);
					var url = window.URL || window.webkitURL;
					var blobURL = url.createObjectURL(blob);
					anchor.href = blobUrl;
					anchor.download = name;
				}
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
	
	/* CSSエディタ変更周り */
	// エディタに変化があったらプレビュー予約
	on("#cssEditor", "change", cssChanged);
	on("#cssEditor", "keyup", cssChanged);

	function cssChanged() {
		saved = false;
		var title = document.title;
		if (!title.match(/^\*/)) {
			document.title = "* " + title;
		}
	}

	/* ファイル添付 */
	on("#attachButton", "change", function(e) {
		var elem = e.target;
	    var files = elem.files;
	    attachFiles(files);
	});
	on("body", "dragover", function(e) {
		e.stopPropagation();
		e.preventDefault();
		e.dataTransfer.dropEffect = 'copy';
		this.classList.add('onDragover');
	});
	on("body", "drop", function(e) {
		e.stopPropagation();
		e.preventDefault();
		attachFiles(e.dataTransfer.files);
		this.classList.remove("onDragover");
	});
	on("body", "dragleave", function(e){
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
							"かんたんMarkdownのファイルを検出しました。どの項目をインポートしますか？"
							, function(result){
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
			editor.value = editor.value + editorElement.value;
			saved = false;
		}
		
		if (result.css == true) {
			var styleElement = dummyHtml.querySelector("#previewerStyle");
			if (styleElement) {
				var cssEditor = document.getElementById("cssEditor");
				cssEditor.value = cssEditor.textContent + styleElement.innerHTML;
				saved = false;
			}
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
			hide(dialogElement);
			
			var result = {
				result: true,
				attach: document.getElementById("importDialogAttach").checked,
				markdown:document.getElementById("importDialogMarkdown").checked,
				css:document.getElementById("importDialogCss").checked,
			}
			callback(result);
			
			if (document.getElementById("importDialogOkButton")) {
				document.getElementById("importDialogOkButton").onclick = null;
			}
			if (document.getElementById("importDialogCancelButton")) {
				document.getElementById("importDialogCancelButton").onclick;
			}
			if (document.getElementById("saveButton")) {
				document.getElementById("saveButton").disabled =  false;
			}
			
			return false;
		};
		
		
		document.getElementById("importDialogCancelButton").onclick = function(e) {
			e.preventDefault();
			hide(dialogElement);
			
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
		var name = fileName;
		var script = document.querySelector("#fileList script[title='" + name + "']");
		var i = 1;
		while (script) {
			var pos = fileName.lastIndexOf(".");
			var name = fileName.substring(0, pos);
			var ext = fileName.substr(pos);
			name = name + "(" + i + ")" + ext;
			script = document.querySelector("#fileList script[title='" + name + "']");
			i++;
		}
		
		var li = document.createElement("li");
		
		var script = document.createElement("script");
		script.type  = "text/template";
		script.id    = "attach-" + name;
		script.title = name;
		script.innerHTML = content;
		li.appendChild(script);

		var input  = document.createElement("input");
		input.type = "text";
		input.classList.add('fileName');
		input.value = name;
		on(input, "blur", onFileNameChanged);
		li.appendChild(input);
		
		var insertButton = document.createElement("button");
		insertButton.classList.add('insertButton');
		insertButton.innerHTML = "insert URI";
		on(insertButton, "click", onInsertButtonClicked);
		li.appendChild(insertButton);
		
		var downloadButton = document.createElement("button");
		downloadButton.classList.add('downloadButton');
		downloadButton.innerHTML = "Download";
		on(downloadButton, "click", onDownloadButtonClicked);
		li.appendChild(downloadButton);
		
		var detachButton = document.createElement("button");
		detachButton.classList.add('detachButton');
		detachButton.innerHTML = "×";
		on(detachButton, "click", onDetachButtonClicked);
		li.appendChild(detachButton);

		document.getElementById("fileList").appendChild(li);
		
		// ファイル添付領域を開く
		var editor = document.getElementById("editor");
		var toggleButton = document.getElementById("toggleButton");
		var filer = document.getElementById("filer");
		if (!isEditMode()) {
			toggleButton.click();
		}
		if (!isVisible(filer)) {
			openFiler();
		}
		
		saved = false;
		queuePreview();
	}

	function getBlob(name) {
		var script = document.getElementById("attach-" + name);
		if (!script) {
			return null;
		}
		
		var base64 = script.innerHTML;
		var mimeType = base64.match(/^\s*data:(.+);base64/)[1];
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

	/* ファイル削除 */
	on(".detachButton", "click", onDetachButtonClicked);
	function onDetachButtonClicked(e) {
		// 削除ボタンが押されたら親要素(li)ごと削除
		if(window.confirm('削除していいですか?')){
			var parent = e.target.parentNode;
			var name = parent.querySelector("script").name;
			
			parent.parentNode.removeChild(parent);
			
			saved = false;
		}
	}

	/* ファイル名変更 */
	var fileNameElems = document.getElementsByClassName("fileName");
	for (var i = 0; i < fileNameElems.length; i++) {
		// なぜかvale属性の変更が保存されないので起動時に引っ張ってきてやる
		var fileNameElem = fileNameElems[i];
		var script = fileNameElem.parentNode.querySelector("script");
		var fileName = script.title;
		fileNameElem.value = fileName;
	}
	on("#fileList input", "blur", onFileNameChanged);
	function onFileNameChanged (e) {
		var target = e.target;
		var name = target.value.trim();
		var selfName = target.parentNode.querySelector("script").title;
		
		if (name == selfName) {
			return true;
		}
		if (name == "") {
			alert("名前は必ず入力してください。");
			e.target.focus();
			return false;
		}
		var script = document.querySelector("#fileList script[title='" + name + "']");
		if (script) {
			alert("名前が重複しています。");
			target.focus();
			target.selectionStart = 0;
			target.selectionEnd = name.length;
			return false;
		} 
		var scriptTag = target.previousElementSibling;
		scriptTag.id =  "attach-" + name;
		scriptTag.title = name;
		saved = false;
		queuePreview();
		return true;
	}

	/* 添付ファイルをエディタに挿入 */
	on(".insertButton", "click", onInsertButtonClicked);
	function onInsertButtonClicked (e) {
		var target = e.target;
		var script = target.parentNode.querySelector("script");
		var fileName = script.title;
		var insertText = "attach:" + fileName;
		
		var editor = document.getElementById("editor");
		if (isVisible(editor)) {
			var text = editor.value;
			var newPos = editor.selectionStart + insertText.length + 1;
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
	}
	
	/* 添付ファイルをダウンロード */
	on(".downloadButton", "click", onDownloadButtonClicked);
	function onDownloadButtonClicked (e) {
		var target = e.target;
		var script = target.parentNode.querySelector("script");
		var fileName = script.title;
		var blob = getBlob(fileName);
		if (window.navigator.msSaveBlob) {
			window.navigator.msSaveBlob(blob, fileName);
		} else {
			var url = window.URL || window.webkitURL;
			var blobURL = url.createObjectURL(blob);
			var a = document.createElement('a');
			a.download = fileName;
			a.href = blobURL;
			
			// firefoxでa.click()が効かないため無理やりclickイベントをディスパッチする
			var ev = document.createEvent("MouseEvents");
		    ev.initMouseEvent("click", true, false, self, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
			a.dispatchEvent(ev);
			delete a;
		}
		
	}

	/* 添付ファイル領域開け閉め */
	on("#attachToggleButton", "click", function() {
		if (isVisible(document.getElementById("filer"))){
			closeFiler();
		} else {
			openFiler();
		}
	});

	/* プレビュー領域開け閉め */
	on("#previewToggleButton", "click", function() {
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
		var editorTabWrapper = document.getElementById("editorTabWrapper");
		var previewer = document.getElementById("previewer");
		if (isEditMode() && !isVisible(previewer)) {
			document.getElementById("previewToggleButton").innerText = "プレビューを隠す(Alt+→)";
			editorTabWrapper.classList.remove("fullWidth");
			showBlock(previewer);
			doLayout();
		}
	}

	function closePreview() {
		// エディタサイズに相対値を利用しているためプレビュー表示されている場合のみ実行
		// 閲覧モード時は実行しない
		var editorTabWrapper = document.getElementById("editorTabWrapper");
		var previewer = document.getElementById("previewer");
		if (isEditMode() && isVisible(previewer)) {
			document.getElementById("previewToggleButton").innerText = "プレビューを表示(Alt+←)";
			editorTabWrapper.classList.add("fullWidth");
			hide(previewer);
			doLayout();
		}
	}

	/* 保存 */
	var contentAtSave = editor.value;
	on("#saveButton", "click", save);
	function save() {
		var wrapperScrollTop = document.getElementById("wrapper").scrollTop;
		var previewerScrollTop = document.getElementById("previewer").scrollTop;
		
		// アップデート用のscriptタグを消す
		document.querySelector("#updateScriptArea").innerHTML = "";
		
		// テキストエリアは値を入れなおさないと保存されない。
		var editor = document.getElementById("editor");
		editor.innerHTML = editor.value.replace(/</g, "&lt;");
		
		var toggleFlag = isEditMode();
		if (toggleFlag == true) {
			toggleMode();
		}
		
		/* ファイルの肥大化を防ぐため中身を消去 */
		document.getElementById("previewer").innerHTML = "";
		document.getElementById("messageArea").innerHTML = "";
		// cssエディタはテキストエリアなので保存されない
		// document.getElementById("cssEditor").value = "";
		
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

	on("#editor", "input", updateSavedFlag);

	function updateSavedFlag() {
		if (contentAtSave == document.getElementById("editor").value) {
			saved = true;
		} else {
			saved = false;
		}
	}

	/* オンラインメニュー */
	on("#onlineMenuButton", "click", function(){
		var button = this;
		var onlineMenu = document.getElementById("onlineMenu");
		onlineMenu.style.top = (this.offsetTop + this.scrollHeight) + "px";
		showBlock(onlineMenu);
	});

	on("body", "click", function(e){
		var onlineMenuButton = document.getElementById("onlineMenuButton");
		if (e.target != onlineMenuButton) {
			hide(document.getElementById("onlineMenu"));
		}
	});

	/* 見出し同期 */
	on("#headingSyncButton", "click", headingSyncToPreviewer);

	on("#previewer", "previewed", function(e) {
		if (isEditMode()) {
			var headings = e.target.querySelectorAll("h1, h2, h3, h4, h5, h6");
			for (var i = 0; i < headings.length; i++) {
				// 見出しにイベントを設定する。メモリリーク対策でプレビュー時に
				// イベントを外しやすくするために、on**で実装する。 
				headings[i].onmouseover = function(){
					this.style.cursor = "pointer";
				}
				headings[i].onclick = headingSyncToEditor;
			}
		}
	});
	
	on("#previewer", "prepreview", function(e) {
		var headings = document.getElementById("previewer")
				.querySelectorAll("h1, h2, h3, h4, h5, h6");
		for (var i = 0; i < headings.length; i++) {
			headings[i].onmouseover = null;
			headings[i].onclick = null;
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
			// 行頭のblockquoteは削除
			line = line.replace(/^\s*(>\s*)+/, "");
			
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
			if (line.match(/^#{1,6}\s(.+)$/)
				|| line.match(/^<h[1-6]>(.*)$/)) {
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
	
	/* Markdown, CSS切り替え */
	on("#markdownTab", "click", function(e) {
		e.preventDefault();
		showMarkdown();
		return false;
	});
	
	on("#cssTab", "click", function(e) {
		e.preventDefault();
		showCss(e);
		return false;
	});
	
	function showMarkdown() {
		var markdownTab = document.querySelector("#markdownTab").parentNode;
		markdownTab.classList.add("selected");
		var editor = document.querySelector("#editor");
		showBlock(editor);
		editor.focus();
		
		var cssTab = document.querySelector("#cssTab").parentNode;
		cssTab.classList.remove("selected");
		var cssEditor = document.querySelector("#cssEditor");
		hide(cssEditor);
	}
	
	function showCss() {
		var markdownTab = document.querySelector("#markdownTab").parentNode;
		markdownTab.classList.remove("selected");
		var editor = document.querySelector("#editor");
		hide(document.querySelector("#editor"));
		
		var cssTab = document.querySelector("#cssTab").parentNode;
		cssTab.classList.add("selected");
		var cssEditor = document.querySelector("#cssEditor");
		showBlock(cssEditor);
		cssEditor.focus();
	}
	
	/* ショートカットキー */
	on("body", "keydown", function(event) {
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
				syncButton.click();
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
	
	function isEditMode() {
		return document.querySelector("body").classList.contains("editMode");
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
		elem.classList.add("showBlock");
		elem.classList.remove("hide");
	}

	function hide(elem) {
		elem.classList.remove("showBlock")
		elem.classList.add("hide");
	}
