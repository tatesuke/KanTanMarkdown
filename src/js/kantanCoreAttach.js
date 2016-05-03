/* アップデート機能 */
(function(prototype, ktm){

	document.addEventListener('DOMContentLoaded', function() {
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
			addClass(this, 'onDragover');
		});
		on("body", "drop", function(e) {
			e.stopPropagation();
			e.preventDefault();
			attachFiles(e.dataTransfer.files);
			removeClass(this, "onDragover");
		});
		on("body", "dragleave", function(e){
			removeClass(this, "onDragover");
		});
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
	
	function attachFile(file, fileName) {
		var fr = new FileReader();
		if (fileName) {
			fr.fileName = fileName;
		} else {
			fr.fileName = file.name;
		}
	    fr.onload = function(e) {
			var target = e.target;
			addAttachFileElement(target.fileName, target.result, "", "", true);
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
			var fileListElement = dummyHtml.querySelectorAll("ul#fileList li");
			for (var i = 0; i < fileListElement.length; i++) {
				var scriptElement = fileListElement[i].querySelector("script");
				var fileName = scriptElement.title;
				var content = scriptElement.innerHTML;
				
				var layerElement = fileListElement[i].querySelector("script.layerContent");
				var layerContent = (layerElement) ? layerElement.innerHTML : "";
				
				var trimInfoElement = fileListElement[i].querySelector("script.trimInfo");
				var trimInfo = (trimInfoElement) ? trimInfoElement.innerHTML : "";
				
				addAttachFileElement(fileName, content, layerContent, trimInfo, false);
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
				var dummyCssEditor = dummyHtml.querySelector("#cssEditor");
				if (styleElement.innerHTML.trim() != "") {
					cssEditor.value = styleElement.innerHTML;
					saved = false;
				} else if (dummyCssEditor) {
					cssEditor.value = dummyCssEditor.value;
					saved = false;
				}
			}
		}
		
		ktm.doPreview();
	} 
	
	function addAttachFileElement(fileName, content, layerContent, trimInfo, insertImgTag) {
		var name = fileName;
		var script = document.querySelector("#fileList script[title='" + name + "']");
		var i = 2;
		while (script) {
			var pos = fileName.lastIndexOf(".");
			pos = (pos != -1) ? pos : fileName.length;
			var name = fileName.substring(0, pos);
			var ext = fileName.substr(pos);
			name = name + "_" + i + ext;
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
		
		var layerScript = document.createElement("script");
		layerScript.type  = "text/template";
		addClass(layerScript, "layerContent");
		layerScript.innerHTML = layerContent;
		li.appendChild(layerScript);
		
		var trimScript = document.createElement("script");
		trimScript.type  = "text/template";
		addClass(trimScript, "trimInfo");
		trimScript.innerHTML = trimInfo;
		li.appendChild(trimScript);
		
		var upButton = document.createElement("button");
		addClass(upButton, 'upButton');
		upButton.innerHTML = "↑";
		on(upButton, "click", onUpButtonClicked);
		li.appendChild(upButton);
		
		var downButton = document.createElement("button");
		addClass(downButton, 'downButton');
		downButton.innerHTML = "↓";
		on(downButton, "click", onDownButtonClicked);
		li.appendChild(downButton);
		
		var input  = document.createElement("input");
		input.type = "text";
		addClass(input, 'fileName');
		input.value = name;
		on(input, "blur", onFileNameChanged);
		li.appendChild(input);
		
		var insertButton = document.createElement("button");
		addClass(insertButton, 'insertButton');
		insertButton.innerHTML = "Insert Tag";
		on(insertButton, "click", onInsertButtonClicked);
		li.appendChild(insertButton);
		
		var isImage = content.match("data:image/.+?;base64,");
		var editoButton = document.createElement("button");
		addClass(editoButton, 'editButton');
		editoButton.innerHTML = "Edit";
		editoButton.disabled = !isImage;
		on(editoButton, "click", ktm.showDrawer);
		li.appendChild(editoButton);
		
		var downloadButton = document.createElement("button");
		addClass(downloadButton, 'downloadButton');
		downloadButton.innerHTML = "Download";
		on(downloadButton, "click", onDownloadButtonClicked);
		li.appendChild(downloadButton);
		
		var detachButton = document.createElement("button");
		addClass(detachButton, 'detachButton');
		detachButton.innerHTML = "×";
		on(detachButton, "click", onDetachButtonClicked);
		li.appendChild(detachButton);
		
		document.getElementById("fileList").appendChild(li);
		
		// ファイル添付領域を開く
		var editor = document.getElementById("editor");
		var toggleButton = document.getElementById("toggleButton");
		var filer = document.getElementById("filer");
		if (!ktm.isEditMode()) {
			toggleButton.click();
		}
		if (!isVisible(filer)) {
			ktm.openFiler();
		}
		
		// イメージタグを挿入
		var setting = document.querySelector("#settingInsertImgTagAfterAttach");
		if (isImage && insertImgTag && setting.checked) {
			var tag = '<img src="attach:' + name  + '">';
			insertToEditor(document.getElementById("editor"), tag);
		}
		
		saved = false;
		ktm.queuePreview();
	}

	function getFileBlog(name, onLoaded) {
		var script = document.getElementById("attach-" + name);
		if (!script) {
			onLoaded(null);
		}
		
		var callBack = function(imageUrl) {
			
		}
		
		var base64 = script.innerHTML;
		var mimeType = base64.match(/^\s*data:(.*);base64/)[1];
		if (mimeType.match("^image")) {
			loadImageByName(name, function(){}, function(imageUrl) {
				onLoaded(base64ToBlob(imageUrl.base64));
			});
		} else {
			onLoaded(base64ToBlob(base64));
		}
	}
	
	/* 添付ファイル並び替え */
	on(".upButton", "click", onUpButtonClicked);
	function onUpButtonClicked(e) {
		var currentLi = e.target.parentNode;
		var previousLi = currentLi.previousElementSibling;
		if (previousLi) {
			var ul = currentLi.parentNode;
			ul.insertBefore(currentLi, previousLi);
		}
	}
	
	on(".downButton", "click", onDownButtonClicked);
	function onDownButtonClicked(e) {
		var currentLi = e.target.parentNode;
		var nextLi = currentLi.nextElementSibling;
		if (nextLi) {
			var ul = currentLi.parentNode;
			ul.insertBefore(nextLi, currentLi);
		}
	}
	
	/* ファイル削除 */
	on(".detachButton", "click", onDetachButtonClicked);
	function onDetachButtonClicked(e) {
		// 削除ボタンが押されたら親要素(li)ごと削除
		if(window.confirm('削除していいですか?')){
			var parent = e.target.parentNode;
			var name = parent.querySelector("script").name;
			uncacheImageUrl(name);
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
		var scriptTag = target.parentNode.querySelector("script");
		uncacheImageUrl(scriptTag.title);
		scriptTag.id =  "attach-" + name;
		scriptTag.title = name;
		saved = false;
		ktm.queuePreview();
		return true;
	}

	/* 添付ファイルをエディタに挿入 */
	on(".insertButton", "click", onInsertButtonClicked);
	function onInsertButtonClicked (e) {
		var target = e.target;
		var script = target.parentNode.querySelector("script");
		var isImage = script.innerHTML.match("data:image/.+?;base64,");
		var fileName = script.title;
		
		var editor = document.getElementById("editor");
		if (isVisible(editor)) {
			var insertText;
			if (isImage) {
				insertText = '<img src="attach:' + fileName  + '">';
			} else {
				insertText= '<a href="attach:' + fileName +'">' + fileName + '</a>';
			}
			insertToEditor(editor, insertText);
		}
		var cssEditor = document.getElementById("cssEditor");
		if (isVisible(cssEditor) && isImage) {
			var insertText = 'url("attach:' + fileName  + '")';
			insertToEditor(cssEditor, insertText);
		}
	}
	
	/* 添付ファイルをダウンロード */
	on(".downloadButton", "click", onDownloadButtonClicked);
	function onDownloadButtonClicked (e) {
		var target = e.target;
		var script = target.parentNode.querySelector("script");
		var fileName = script.title;
		getFileBlog(fileName, function(blob) {
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
		});
	}

	function showImportDialog(msg, callback) {
		document.getElementById("saveButton").disabled =  true;
		document.getElementById("importDialogMessage").innerText = msg;
		var dialogElement = document.getElementById("importDialog");
		dialogElement.querySelector("form").reset();
		
		document.getElementById("importDialogOkButton").onclick = function(e){
			e.preventDefault();
			hide(dialogElement);
			document.getElementById("importDialogMessage").innerText = "";
			
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
			document.getElementById("importDialogMessage").innerText = "";
			
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
	
	/* お絵かき周り */
	var drawer = new KantanDrawer(document.querySelector("#drawArea"));
	on(".editButton", "click", ktm.showDrawer);
	prototype.showDrawer = function(e) {
		var rootElement = e.target.parentNode;
		var contentElement = rootElement.querySelector("script");
		var layerElement = rootElement.querySelector("script.layerContent");
		var trimElement = rootElement.querySelector("script.trimInfo");
		
		addClass(document.querySelector("body"), "drawMode");
		
		var nav = document.querySelector("nav");
		var attach = document.querySelector("#attach");
		var wrapper = document.querySelector("#wrapper");
		
		hide(nav);;
		hide(attach);
		hide(wrapper);
		
		drawer.show(contentElement.innerHTML,
				layerElement.innerHTML,
				trimElement.innerHTML,
				function(layerContent, trimInfo) {
					layerElement.innerHTML = layerContent;
					trimElement.innerHTML = trimInfo;
					
					showBlock(nav);
					showBlock(attach);
					showBlock(wrapper);
					removeClass(document.querySelector("body"), "drawMode");
					
					uncacheImageUrl(contentElement.title);
					ktm.doPreview();
				},
				function() {
					showBlock(nav);
					showBlock(attach);
					showBlock(wrapper);
					removeClass(document.querySelector("body"), "drawMode");
				}
		);
	}
	
		/* 画像キャッシュ */
	var imageUrlMap = {};
	prototype.getCachedImageUrl = function(name, createOnNoCached) {
		var imageUrl = imageUrlMap[name];
		if ((imageUrl == null) && createOnNoCached) {
			var element = document.getElementById("attach-" + name);
			if (element != null) {
				return cacheImageUrl(name, element.innerHTML);
			} else {
				return null;
			}
		} else {
			return imageUrl;
		}	
	}

	prototype.cacheImageUrl = function (name, base64) {
		var imageUrl;
		if (window.URL) {
			var blob = base64ToBlob(base64);
			imageUrl = {
					blobOrBase64:window.URL.createObjectURL(blob),
					base64:base64}
		} else {
			imageUrl = {
					blobOrBase64:base64,
					base64:base64}
		}
		
		imageUrlMap[name] = imageUrl;
		return imageUrl;
	}

	function uncacheImageUrl(name) {
		var imageUrl = imageUrlMap[name];
		if (window.URL && imageUrl) {
			window.URL.revokeObjectURL(imageUrl);
		} 
		delete imageUrlMap[name];
	}
	
	function addAttachEditLayer(fileName, content) {
		var script = document.createElement("script");
		script.type  = "text/template";
		script.className = "editLayer";
		script.innerHTML = content;
		
		var attach = document.getElementById("attach-" + fileName);
		var parent = attach.parentNode;
		parent.insertBefore(script, attach.nextSibling);
	}
	
	/* 画面キャプチャ貼り付け */
	// Chrome向け
	on("#pasteArea", "paste",function(e){
		if (!e.clipboardData || !e.clipboardData.types) {
			return true;
		}
		
		var fileFlag = false;
		for (var i=0; i < e.clipboardData.types.length; i++) {
			if (e.clipboardData.types[i] == "Files") {
				fileFlag = true;
				break;
			}
		}
		if (fileFlag == false) {
			return true;
		}
		
		e.preventDefault();
		for (var i = 0; i < e.clipboardData.items.length; i++) {
			attachFile(e.clipboardData.items[i].getAsFile(), "clipboard");
		}
		return false;
	});
	
	// FF, IE向け
	on("#pasteArea", "keyup",function(e){
		e.preventDefault();
		
		var dummyElement = document.createElement("div");
		dummyElement.innerHTML = this.innerHTML;
		var imgElement = dummyElement.querySelector("img");
		if (imgElement) {
			var base64 = imgElement.src;
			addAttachFileElement("clipboard", base64, "", "", true);
		}
		
		this.innerHTML = "ここをクリックしてCtrl+V(Cmd+V)するとクリップボードの画像を添付できます。";
		return false;
	});

})(prototype, ktm);