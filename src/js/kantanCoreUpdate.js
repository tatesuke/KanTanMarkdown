/* 
 * アップデート機能 
 * JOSONPでアップデート
 */
(function(prototype, ktm){

	const _UPDATE_URL = "http://tatesuke.github.io/KanTanMarkdown/kantanUpdate.js";
	// const UPDATE_URL = "http://localhost:3000/kantanUpdate.js";

	document.addEventListener('DOMContentLoaded', function() {
		/* アップデート */
	    ktm.rewriteKantanVersion(document.getElementById("kantanVersion").value);
	    on("#updateButton", "click", requestUpdate);
	});
	
	function requestUpdate(event) {
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
			script.src = _UPDATE_URL;
			script.class = "kantanUpdateScript";
			script.onerror = function () {
				alert("アップデートに失敗しました。\n" + 
				"アップデート用のファイルにアクセスできませんでした。\n" + 
				"インターネットに接続されていないか、サーバーダウンです");
			};
			document.querySelector("#updateScriptArea").appendChild(script);
			
			return false;
		}
	
	prototype.rewriteKantanVersion = function (version) {
		document.getElementById("kantanVersion").value = version;
		var edition = document.getElementById("kantanEdition").value;
		var versionElements = document.getElementsByClassName("version");
		for (var i = 0 ; i < versionElements.length; i++) {
			versionElements[i].innerText = version + "_" + edition;
		}
	}
	
	prototype.updateKantanEdition = function (edition) {
		document.getElementById("kantanEdition").value = edition;
	}
	
	prototype.kantanUpdate = function (json) {
		json.doUpdate();
	}
	
})(prototype, ktm);