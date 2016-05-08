/* 基本的なUIの制御 */
(function(prototype, ktm){
	
	const _$body                = document.body;
	const _$onlineMenuButton    = document.getElementById("onlineMenuButton");
	const _$settingMenuButton   = document.getElementById("settingMenuButton");
	const _$settingAutoSync     = document.getElementById("settingAutoSync");
	const _$toggleButton        = document.getElementById("toggleButton");
	const _$attachToggleButton  = document.getElementById("attachToggleButton");
	const _$previewToggleButton = document.getElementById("previewToggleButton");
	const _$markdownTab         = document.getElementById("markdownTab");
	const _$cssTab              = document.getElementById("cssTab");
	const _$editorTabWrapper    = document.getElementById("editorTabWrapper");
	const _$attach              = document.getElementById("attach");
	const _$editor              = document.getElementById("editor");
	const _$previewer           = document.getElementById("previewer");
	const _$wrapper             = document.getElementById("wrapper");
	const _$attachForm          = document.getElementById("attachForm");
	const _$filer               = document.getElementById("filer");
	const _$onlineMenu          = document.getElementById("onlineMenu");
	const _$settingMenu         = document.getElementById("settingMenu");
	const _$cssEditor           = document.getElementById("cssEditor");
	
	var _contentAtSave = _$editor.value;
	
	var _editorScrollBarPos = 0;
	var _caretStartPos      = 0;
	var _caretEndPos        = 0;
	var _isPreviewerOpened  = true;

	document.addEventListener('DOMContentLoaded', function() {
		initLayout();
		on(window               , "resize", ktm.doLayout);
		on(_$onlineMenuButton   , "click" , showOnlineMenu);
		on(_$body               , "click" , hideOnlineMenuIfNecessary);
		on(_$toggleButton       , "click" , ktm.toggleMode);
		on(_$attachToggleButton , "click" , toggleAttach);
		on(_$previewToggleButton, "click" , togglePreview);
		on(_$editor             , "input" , ktm.updateSavedFlag);
		on(_$markdownTab        , "click" , showMarkdownEditor);
		on(_$cssTab             , "click" , showCssEditor); 
		
		toKantanEditor(document.getElementById("cssEditor"));
		toKantanEditor(document.getElementById("editor"));
	
		
		on(_$body  , "ktm_before_save", beforeSave);
		on(_$editor, "input", ktm.updateSavedFlag);
		on("#cssEditor", "input", cssChanged);
	
		initLocalSetting();
	});
	
	function cssChanged() {
		ktm.setSaved(false);
	}
	
	function beforeSave(){
		_contentAtSave = _$editor.value;
	}
	
	prototype.updateSavedFlag = function() {
		var saved = (_contentAtSave === _$editor.value);
		ktm.setSaved(saved);
	}
		
	prototype.isEditMode = function () {
		return isVisible(_$editorTabWrapper);
	}
	
	prototype.isDrawMode = function () {
		return _$body.classList.contains("drawMode");
	}
	
	prototype.toggleMode = function() {
		if (ktm.isEditMode()) {
			changeToPreviewMode();
		} else {
			changeToEditMode();
		}
	}
	
	prototype.doLayout = function() {
		var wrapperHeight     = window.innerHeight - _$wrapper.offsetTop - 10;
		_$wrapper.style.height = wrapperHeight + "px";
	}

	prototype.openFiler = function() {
		_$attachToggleButton.innerText = "添付ファイルを隠す(Alt+↑)";
		showBlock(_$attachForm);
		showBlock(_$filer);
		ktm.doLayout();
	}
	
	prototype.closeFiler = function() {
		_$attachToggleButton.innerText = "添付ファイルを表示(Alt+↓)";
		hide(_$attachForm);
		hide(_$filer);
		ktm.doLayout();
	}

	prototype.openPreview = function() {
		// エディタサイズに相対値を利用しているためプレビュー表示されていない場合のみ実行
		// 閲覧モード時は実行しない
		if (ktm.isEditMode() && !isVisible(_$previewer)) {
			_$previewToggleButton.innerText = "プレビューを隠す(Alt+→)";
			removeClass(_$editorTabWrapper, "fullWidth");
			showBlock(_$previewer);
			ktm.doLayout();
		}
	}

	prototype.closePreview = function() {
		// エディタサイズに相対値を利用しているためプレビュー表示されている場合のみ実行
		// 閲覧モード時は実行しない
		if (ktm.isEditMode() && isVisible(_$previewer)) {
			_$previewToggleButton.innerText = "プレビューを表示(Alt+←)";
			addClass(_$editorTabWrapper, "fullWidth");
			hide(_$previewer);
			ktm.doLayout();
		}
	}
	
	function initLayout() {
		addClass(_$body, "previewMode");
		removeClass(_$body, "editMode");
		removeClass(_$body, "initialState");
		
		if (isEnable(_$toggleButton) && (_$editor.innerHTML == "")) {
			// 編集モードでなく、内容が空であれば初期状態を編集モードにする
			ktm.toggleMode();
		} else {
			ktm.doPreview();
		}
		
		ktm.doLayout();
	}
	
	function initLocalSetting() {
		on(_$settingMenuButton  , "click" , showSettingMenu);
		/* 端末固有設定 */
		// 現在のところチェックボックスのみなので
		// チェックボックスに特化して実装している
		var saveValueElements = _$settingMenu.querySelectorAll("input[type=checkbox]");
		for (var i = 0; i < saveValueElements.length; i++) {
			var element    = saveValueElements[i];
			var savedValue = getItem(element.id, null);
			
			element.checked = (savedValue != null) && (savedValue == "true");
			
			on (element, "change", function() {
				setItem(this.id, this.checked);
			});
		}
		
		// 自動同期チェックボックスをクリックしたらchecked属性を更新する
		// これを行わないと自動同期チェックボックスの状態が保存されない
		on(_$settingAutoSync, "change", function() {
			if (this.checked == true) {
				this.setAttribute("checked", "checked");
			} else {
				this.removeAttribute("checked");
			}
		});
		
		on(_$body , "click" , hideSettingMenuIfNecessary);
	}

	function showOnlineMenu(){
		var b = _$onlineMenuButton;
		_$onlineMenu.style.top = (b.offsetTop + b.scrollHeight) + "px";
		showBlock(_$onlineMenu);
	}

	function hideOnlineMenuIfNecessary (e) {
		if (e.target != _$onlineMenuButton) {
			hide(_$onlineMenu);
		}
	}

	function showSettingMenu(){
		var b = _$settingMenuButton;
		_$settingMenu.style.top  = (b.offsetTop + b.scrollHeight) + "px";
		_$settingMenu.style.left = b.offsetLeft + "px";
		showBlock(_$settingMenu);
	}

	function hideSettingMenuIfNecessary (e){
		var current = e.target;
		while (current != null) {
			if ((current ==  _$settingMenuButton) || (current == _$settingMenu)) {
				return true;
			}
			current = current.parentNode;
		}
		
		hide(_$settingMenu);
	}
	
	function toggleAttach () {
		if (isVisible(_$filer)){
			ktm.closeFiler();
		} else {
			ktm.openFiler();
		}
	}

	function togglePreview() {
		if (isVisible(_$previewer)){
			ktm.closePreview();
		} else {
			ktm.openPreview();
		}
	}
	
	function changeToPreviewMode() {
		_editorScrollBarPos = _$editor.scrollTop;
		_caretStartPos      = _$editor.selectionStart;
		_caretEndPos        = _$editor.selectionEnd;
		_isPreviewerOpened  = isVisible(_$previewer);
		
		if (_isPreviewerOpened == false) {
			openPreview();
		}
		
		hide(_$attach);
		hide(_$editorTabWrapper);
		ktm.doPreview();
		
		// スクロールバー位置記憶
		var minDiff = null;
		var minElem = null;
		var elems   = _$previewer.querySelectorAll("*");
		for (var i = 0; i < elems.length; i++) {
			var diff = _$previewer.scrollTop - (elems[i].offsetTop - _$previewer.offsetTop);
			if ((minDiff == null) || (Math.abs(diff) < Math.abs(minDiff))) {
				minDiff = diff;
				minElem = elems[i];
			}
		}	
		
		// レイアウト修正
		addClass(_$body, "previewMode");
		removeClass(_$body, "editMode");
		ktm.doLayout();
		
		_$previewer.focus();
		
		if (minElem) {
			wrapper.scrollTop = (minElem.offsetTop - _$previewer.offsetTop) + minDiff;
		}
	}
	
	function changeToEditMode() {
		showBlock(_$attach);
		showBlock(_$editorTabWrapper);
		ktm.doPreview();

		// スクロールバー位置記憶
		var minDiff = null;
		var minElem = null;
		var elems   = _$previewer.querySelectorAll("*");
		for (var i = 0; i < elems.length; i++) {
			var diff = wrapper.scrollTop - (elems[i].offsetTop - _$previewer.offsetTop);
			if ((minDiff == null) || (Math.abs(diff) < Math.abs(minDiff))) {
				minDiff = diff;
				minElem = elems[i];
			}
		}		

		if (_isPreviewerOpened == false) {
			closePreview();
		}

		// レイアウト修正
		removeClass(_$body, "previewMode");
		addClass(_$body, "editMode");
		ktm.doLayout();

		if (minElem) {
			_$previewer.scrollTop = (minElem.offsetTop - _$previewer.offsetTop) + minDiff;
		}

		_$editor.focus();
		_$editor.scrollTop      = _editorScrollBarPos;
		_$editor.selectionStart = _caretStartPos;
		_$editor.selectionEnd   = _caretEndPos;
	}

	function showMarkdownEditor(e) {
		e.preventDefault();
		
		addClass(_$markdownTab.parentNode, "selected");
		showBlock(_$editor);
		_$editor.focus();
		
		removeClass(cssTab.parentNode, "selected");
		hide(_$cssEditor);
		
		return false;
	}
	
	function showCssEditor(e) {
		e.preventDefault();
		
		removeClass(markdownTab.parentNode, "selected");
		hide(_$editor);
		
		addClass(cssTab.parentNode, "selected");
		showBlock(_$cssEditor);
		_$cssEditor.focus();
		
		return false;
	}

})(prototype, ktm);