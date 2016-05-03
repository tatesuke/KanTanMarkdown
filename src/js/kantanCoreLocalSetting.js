/* 端末固有設定 */
(function(prototype, ktm){

	document.addEventListener('DOMContentLoaded', function() {
		/* 端末固有設定 */
		// 現在のところチェックボックスのみなので
		// チェックボックスに特化して実装している
		var saveValueElements = document.querySelectorAll(
				"#settingMenu input[type=checkbox]");
		for (var i = 0; i < saveValueElements.length; i++) {
			var element = saveValueElements[i];
			var savedValue = getItem(element.id, null);
			if (savedValue != null) {
				element.checked = (savedValue == "true");
			}
			on (element, "change", function() {
				setItem(this.id, this.checked);
			});
		}
		
		// 自動同期チェックボックスをクリックしたらchecked属性を更新する
		// これを行わないと自動同期チェックボックスの状態が保存されない
		on("#settingAutoSync", "change", function() {
			if (this.checked == true) {
				this.setAttribute("checked", "checked");
			} else {
				this.removeAttribute("checked");
			}
		});
	});
	
})(prototype, ktm);