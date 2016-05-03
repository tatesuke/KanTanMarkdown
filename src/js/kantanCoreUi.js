/* アップデート機能 */
(function(prototype, ktm){

	document.addEventListener('DOMContentLoaded', function() {
		/* 起動時にコンテンツ読み込み */
		addClass(document.querySelector("body"), "previewMode");
		removeClass(document.querySelector("body"), "editMode");
		removeClass(document.querySelector("body"), "initialState");
		if (isEnable(document.getElementById("toggleButton")) 
				&& (document.getElementById("editor").innerHTML == "")) {
			// 編集モードでなく、内容が空であれば初期状態を編集モードにする
			ktm.toggleMode();
		} else {
			ktm.doPreview();
		}
		
		/* レイアウト調整 */
		ktm.doLayout();
		on(window, "resize", ktm.doLayout);
		
		/* 編集・閲覧切り替え */
		
		on("#toggleButton", "click", ktm.toggleMode);
		
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
		
		/* 設定メニュー */
		on("#settingMenuButton", "click", function(){
			var button = this;
			var settingMenu = document.getElementById("settingMenu");
			settingMenu.style.top = (this.offsetTop + this.scrollHeight) + "px";
			settingMenu.style.left = this.offsetLeft + "px";
			showBlock(settingMenu);
		});

		on("body", "click", function(e){
			var current = e.target;
			
			var settingMenuButton = document.getElementById("settingMenuButton");
			if (current ==  settingMenuButton) {
				return true;
			}
			
			var settingMenu = document.getElementById("settingMenu");
			while (current != null) {
				if (current == settingMenu) {
					return true;
				}
				current = current.parentNode;
			}
			hide(settingMenu);
		});
	});
	
	var editorScrollBarPos = 0;
	var caretStartPos = 0;
	var caretEndPos = 0;
	var isPreviewerOpened = true;
	prototype.toggleMode = function() {
		var attach = document.getElementById("attach");
		var editorTabWrapper = document.getElementById("editorTabWrapper");
		var editor = document.getElementById("editor");
		var previewer = document.getElementById("previewer");
		if (ktm.isEditMode()) {
			editorScrollBarPos    = editor.scrollTop;
			caretStartPos = editor.selectionStart;
			caretEndPos = editor.selectionEnd;
		}

		if (ktm.isEditMode()) {
			// プレビューモードへ
			isPreviewerOpened = isVisible(previewer);
			if (isPreviewerOpened == false) {
				openPreview();
			}
			
			hide(attach);
			hide(editorTabWrapper);
			ktm.doPreview();
			
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
			addClass(document.querySelector("body"), "previewMode");
			removeClass(document.querySelector("body"), "editMode");
			ktm.doLayout();
			
			previewer.focus();
			
			if (minElem) {
				wrapper.scrollTop = (minElem.offsetTop - previewer.offsetTop) + minDiff;
			}
		} else {
			// 編集モードへ
			showBlock(attach);
			showBlock(editorTabWrapper);
			ktm.doPreview();
			
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
			removeClass(document.querySelector("body"), "previewMode");
			addClass(document.querySelector("body"), "editMode");
			ktm.doLayout();
			
			if (minElem) {
				previewer.scrollTop = (minElem.offsetTop - previewer.offsetTop) + minDiff;
			}
		}
		

		if (ktm.isEditMode()) {
			editor.scrollTop    = editorScrollBarPos;
			editor.selectionStart = caretStartPos;
			editor.selectionEnd = caretEndPos;
			editor.focus();
		}
	}
	
	prototype.doLayout = function() {
		var wrapper = document.getElementById("wrapper");
		
		var wrapperHeight = window.innerHeight - wrapper.offsetTop - 10;
		wrapper.style.height = wrapperHeight + "px";
	}

	/* 添付ファイル領域開け閉め */
	on("#attachToggleButton", "click", function() {
		if (isVisible(document.getElementById("filer"))){
			closeFiler();
		} else {
			ktm.openFiler();
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

	prototype.openFiler = function() {
		document.getElementById("attachToggleButton").innerText = "添付ファイルを隠す(Alt+↑)";
		showBlock(document.getElementById("attachForm"));
		showBlock(document.getElementById("filer"));
		ktm.doLayout();
	}

	function closeFiler() {
		document.getElementById("attachToggleButton").innerText = "添付ファイルを表示(Alt+↓)";
		hide(document.getElementById("attachForm"));
		hide(document.getElementById("filer"));
		ktm.doLayout();
	}

	function openPreview() {
		// エディタサイズに相対値を利用しているためプレビュー表示されていない場合のみ実行
		// 閲覧モード時は実行しない
		var editorTabWrapper = document.getElementById("editorTabWrapper");
		var previewer = document.getElementById("previewer");
		if (ktm.isEditMode() && !isVisible(previewer)) {
			document.getElementById("previewToggleButton").innerText = "プレビューを隠す(Alt+→)";
			removeClass(editorTabWrapper, "fullWidth");
			showBlock(previewer);
			ktm.doLayout();
		}
	}

	function closePreview() {
		// エディタサイズに相対値を利用しているためプレビュー表示されている場合のみ実行
		// 閲覧モード時は実行しない
		var editorTabWrapper = document.getElementById("editorTabWrapper");
		var previewer = document.getElementById("previewer");
		if (ktm.isEditMode() && isVisible(previewer)) {
			document.getElementById("previewToggleButton").innerText = "プレビューを表示(Alt+←)";
			addClass(editorTabWrapper, "fullWidth");
			hide(previewer);
			ktm.doLayout();
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
		addClass(markdownTab, "selected");
		var editor = document.querySelector("#editor");
		showBlock(editor);
		editor.focus();
		
		var cssTab = document.querySelector("#cssTab").parentNode;
		removeClass(cssTab, "selected");
		var cssEditor = document.querySelector("#cssEditor");
		hide(cssEditor);
	}
	
	function showCss() {
		var markdownTab = document.querySelector("#markdownTab").parentNode;
		removeClass(markdownTab, "selected");
		var editor = document.querySelector("#editor");
		hide(document.querySelector("#editor"));
		
		var cssTab = document.querySelector("#cssTab").parentNode;
		addClass(cssTab, "selected");
		var cssEditor = document.querySelector("#cssEditor");
		showBlock(cssEditor);
		cssEditor.focus();
	}
	
	prototype.isEditMode = function () {
		return isVisible(document.querySelector("#editorTabWrapper"));
	}
	
	prototype.isDrawMode = function () {
		return document.querySelector("body").classList.contains("drawMode");
	}

})(prototype, ktm);