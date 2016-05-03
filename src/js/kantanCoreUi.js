/* 基本的なUIの制御 */
(function(prototype, ktm){
	
	const $body                = document.body;
	const $onlineMenuButton    = document.getElementById("onlineMenuButton");
	const $settingMenuButton   = document.getElementById("settingMenuButton");
	const $toggleButton        = document.getElementById("toggleButton");
	const $attachToggleButton  = document.getElementById("attachToggleButton");
	const $previewToggleButton = document.getElementById("previewToggleButton");
	const $markdownTab         = document.getElementById("markdownTab");
	const $cssTab              = document.getElementById("cssTab");
	const $editorTabWrapper    = document.getElementById("editorTabWrapper");
	const $attach              = document.getElementById("attach");
	const $editor              = document.getElementById("editor");
	const $previewer           = document.getElementById("previewer");
	const $wrapper             = document.getElementById("wrapper");
	const $attachForm          = document.getElementById("attachForm");
	const $filer               = document.getElementById("filer");
	const $onlineMenu          = document.getElementById("onlineMenu");
	const $settingMenu         = document.getElementById("settingMenu");
	const $cssEditor           = document.getElementById("cssEditor");
	
	var _editorScrollBarPos = 0;
	var _caretStartPos      = 0;
	var _caretEndPos        = 0;
	var _isPreviewerOpened  = true;

	document.addEventListener('DOMContentLoaded', function() {
		initLayout();
		on(window              , "resize", ktm.doLayout);
		on($onlineMenuButton   , "click" , showOnlineMenu);
		on($body               , "click" , hideOnlineMenuIfNecessary);
		on($settingMenuButton  , "click" , showSettingMenu);
		on($body               , "click" , hideSettingMenuIfNecessary);
		on($toggleButton       , "click" , ktm.toggleMode);
		on($attachToggleButton , "click" , toggleAttach);
		on($previewToggleButton, "click" , togglePreview);
		on($markdownTab        , "click" , showMarkdown);
		on($cssTab             , "click" , showCss); 
	});
		
	prototype.isEditMode = function () {
		return isVisible($editorTabWrapper);
	}
	
	prototype.isDrawMode = function () {
		return $body.classList.contains("drawMode");
	}
	
	prototype.toggleMode = function() {
		if (ktm.isEditMode()) {
			changeToPreviewMode();
		} else {
			changeToEditMode();
		}
	}
	
	prototype.doLayout = function() {
		var wrapperHeight     = window.innerHeight - $wrapper.offsetTop - 10;
		$wrapper.style.height = wrapperHeight + "px";
	}

	prototype.openFiler = function() {
		$attachToggleButton.innerText = "添付ファイルを隠す(Alt+↑)";
		showBlock($attachForm);
		showBlock($filer);
		ktm.doLayout();
	}
	
	prototype.closeFiler = function() {
		attachToggleButton.innerText = "添付ファイルを表示(Alt+↓)";
		hide($attachForm);
		hide($filer);
		ktm.doLayout();
	}

	prototype.openPreview = function() {
		// エディタサイズに相対値を利用しているためプレビュー表示されていない場合のみ実行
		// 閲覧モード時は実行しない
		if (ktm.isEditMode() && !isVisible($previewer)) {
			$previewToggleButton.innerText = "プレビューを隠す(Alt+→)";
			removeClass($editorTabWrapper, "fullWidth");
			showBlock($previewer);
			ktm.doLayout();
		}
	}

	prototype.closePreview = function() {
		// エディタサイズに相対値を利用しているためプレビュー表示されている場合のみ実行
		// 閲覧モード時は実行しない
		if (ktm.isEditMode() && isVisible($previewer)) {
			$previewToggleButton.innerText = "プレビューを表示(Alt+←)";
			addClass($editorTabWrapper, "fullWidth");
			hide($previewer);
			ktm.doLayout();
		}
	}
	
	function initLayout() {
		addClass($body, "previewMode");
		removeClass($body, "editMode");
		removeClass($body, "initialState");
		
		if (isEnable($toggleButton) && ($editor.innerHTML == "")) {
			// 編集モードでなく、内容が空であれば初期状態を編集モードにする
			ktm.toggleMode();
		} else {
			ktm.doPreview();
		}
		
		ktm.doLayout();
	}

	function showOnlineMenu(){
		var b = $onlineMenuButton;
		$onlineMenu.style.top = (b.offsetTop + b.scrollHeight) + "px";
		showBlock($onlineMenu);
	}

	function hideOnlineMenuIfNecessary (e) {
		if (e.target != $onlineMenuButton) {
			hide($onlineMenu);
		}
	}

	function showSettingMenu(){
		var b = $settingMenuButton;
		$settingMenu.style.top  = (b.offsetTop + b.scrollHeight) + "px";
		$settingMenu.style.left = b.offsetLeft + "px";
		showBlock($settingMenu);
	}

	function hideSettingMenuIfNecessary (e){
		var current = e.target;
		while (current != null) {
			if ((current ==  $settingMenuButton) || (current == $settingMenu)) {
				return true;
			}
			current = current.parentNode;
		}
		
		hide($settingMenu);
	}
	
	function toggleAttach () {
		if (isVisible($filer)){
			ktm.closeFiler();
		} else {
			ktm.openFiler();
		}
	}

	function togglePreview() {
		if (isVisible($previewer)){
			ktm.closePreview();
		} else {
			ktm.openPreview();
		}
	}
	
	function changeToPreviewMode() {
		_editorScrollBarPos = $editor.scrollTop;
		_caretStartPos      = $editor.selectionStart;
		_caretEndPos        = $editor.selectionEnd;
		_isPreviewerOpened  = isVisible($previewer);
		
		if (_isPreviewerOpened == false) {
			openPreview();
		}
		
		hide($attach);
		hide($editorTabWrapper);
		ktm.doPreview();
		
		// スクロールバー位置記憶
		var minDiff = null;
		var minElem = null;
		var elems   = $previewer.querySelectorAll("*");
		for (var i = 0; i < elems.length; i++) {
			var diff = $previewer.scrollTop - (elems[i].offsetTop - $previewer.offsetTop);
			if ((minDiff == null) || (Math.abs(diff) < Math.abs(minDiff))) {
				minDiff = diff;
				minElem = elems[i];
			}
		}	
		
		// レイアウト修正
		addClass($body, "previewMode");
		removeClass($body, "editMode");
		ktm.doLayout();
		
		$previewer.focus();
		
		if (minElem) {
			wrapper.scrollTop = (minElem.offsetTop - $previewer.offsetTop) + minDiff;
		}
	}
	
	function changeToEditMode() {
		showBlock($attach);
		showBlock($editorTabWrapper);
		ktm.doPreview();

		// スクロールバー位置記憶
		var minDiff = null;
		var minElem = null;
		var elems   = $previewer.querySelectorAll("*");
		for (var i = 0; i < elems.length; i++) {
			var diff = wrapper.scrollTop - (elems[i].offsetTop - $previewer.offsetTop);
			if ((minDiff == null) || (Math.abs(diff) < Math.abs(minDiff))) {
				minDiff = diff;
				minElem = elems[i];
			}
		}		

		if (_isPreviewerOpened == false) {
			closePreview();
		}

		// レイアウト修正
		removeClass($body, "previewMode");
		addClass($body, "editMode");
		ktm.doLayout();

		if (minElem) {
			$previewer.scrollTop = (minElem.offsetTop - $previewer.offsetTop) + minDiff;
		}

		$editor.focus();
		$editor.scrollTop      = _editorScrollBarPos;
		$editor.selectionStart = _caretStartPos;
		$editor.selectionEnd   = _caretEndPos;
	}

	function showMarkdown(e) {
		e.preventDefault();
		
		addClass($markdownTab.parentNode, "selected");
		showBlock($editor);
		$editor.focus();
		
		removeClass(cssTab.parentNode, "selected");
		hide($cssEditor);
		
		return false;
	}
	
	function showCss(e) {
		e.preventDefault();
		
		removeClass(markdownTab.parentNode, "selected");
		hide($editor);
		
		addClass(cssTab.parentNode, "selected");
		showBlock($cssEditor);
		$cssEditor.focus();
		
		return false;
	}

})(prototype, ktm);