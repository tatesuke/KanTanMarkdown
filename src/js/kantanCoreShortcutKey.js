/* アップデート機能 */
(function(prototype, ktm){

	document.addEventListener('DOMContentLoaded', function() {
		/* ショートカットキー */
		on("body", "keydown", function(event) {
			var code = (event.keyCode ? event.keyCode : event.which);
			
			if (ktm.isDrawMode()) {
				if (code == 83 && (event.ctrlKey || event.metaKey)){
					event.preventDefault();
					return false;
				} else {
					return true;
				}
			}
			
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
				if (isEnable(document.getElementById("saveButton"))) {
					ktm.save();
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
				ktm.openPreview();
				return false;
			}

			if ((code == 38) && event.altKey) {
				// Alt+↑
				event.preventDefault();
				ktm.closeFiler();
				return false;
			}

			if ((code == 39) && event.altKey) {
				// Alt+→
				event.preventDefault();
				ktm.closePreview();
				return false;
			}
			
			if ((code == 40) && event.altKey) {
				// Alt+↓
				event.preventDefault();
				ktm.openFiler();
				return false;
			}
			
			if (code == 113) {
				// F2で見出し同期（エディタ→プレビューア）
				event.preventDefault();
				ktm.headingSyncToPreviewer();
				return false;
			}
			
			return true;
		});
	});

})(prototype, ktm);