/*
 * 編集不可ブラウザ判定 
 * サポートしていないブラウザの場合、起動時に閲覧専用モードにする
 */
(function(prototype, ktm){

	document.addEventListener('DOMContentLoaded', function() {
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
	});
	
	function setViewOnly() {
		document.getElementById("messageArea").innerText
				 = "このブラウザでは編集できません。";
		var navElems = document.querySelectorAll("nav > *");
		for (var i = 0; i < navElems.length; i++) {
			navElems[i].setAttribute("disabled", "disabled");
		}
	}
	
})(prototype, ktm);