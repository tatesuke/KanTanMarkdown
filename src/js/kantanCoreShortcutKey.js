/* アップデート機能 */
(function(prototype, ktm){

	const KEY_CODE_LEFT  = 37;
	const KEY_CODE_UP    = 38;
	const KEY_CODE_RIGHT = 39;
	const KEY_CODE_DOWN  = 40;
	const KEY_CODE_R     = 82;
	const KEY_CODE_S     = 83;
	const KEY_CODE_ESC   = 27;
	const KEY_CODE_F1    = 112;
	const KEY_CODE_F2    = 113;
	const KEY_CODE_F5    = 116;
	
	document.addEventListener('DOMContentLoaded', function() {
		/* ショートカットキー */
		on("body", "keydown", function(event) {
			var code = (event.keyCode ? event.keyCode : event.which);
			
			if (ktm.isDrawMode()) {
				// DrawModeでのCtrl+Sを抑止する
				if (code == KEY_CODE_S && (event.ctrlKey || event.metaKey)){
					event.preventDefault();
					return false;
				} else {
					return true;
				}
			}
			
			if (code == KEY_CODE_ESC) {
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
			
			
			if (code == KEY_CODE_S && (event.ctrlKey || event.metaKey)){
				// CTRL+Sで保存する
				event.preventDefault();
				if (isEnable(document.getElementById("saveButton"))) {
					ktm.save();
				}
				return false;
			}
			
			if (code == KEY_CODE_F5 ||
					((code == KEY_CODE_R) && (event.ctrlKey || event.metaKey))){
				// F5 or Ctrl + Rでエディタとプレビューアを同期
				event.preventDefault();
				
				var syncButton = document.getElementById("syncButton");
				if (isEnable(syncButton)) {
					syncButton.click();
				}
				return false;
			}
			
			if (code == KEY_CODE_F1){
				// F1でヘルプ
				event.preventDefault();
				
				var helpButton = document.getElementById("helpButton");
				helpButton.click();
				
				return false;
			}

			if ((code == KEY_CODE_LEFT) && event.altKey) {
				// Alt+←
				event.preventDefault();
				ktm.openPreview();
				return false;
			}

			if ((code == KEY_CODE_UP) && event.altKey) {
				// Alt+↑
				event.preventDefault();
				ktm.closeFiler();
				return false;
			}

			if ((code == KEY_CODE_RIGHT) && event.altKey) {
				// Alt+→
				event.preventDefault();
				ktm.closePreview();
				return false;
			}
			
			if ((code == KEY_CODE_DOWN) && event.altKey) {
				// Alt+↓
				event.preventDefault();
				ktm.openFiler();
				return false;
			}
			
			if (code == KEY_CODE_F2) {
				// F2で見出し同期（エディタ→プレビューア）
				event.preventDefault();
				ktm.headingSyncToPreviewer();
				return false;
			}
			
			return true;
		});
	});

})(prototype, ktm);