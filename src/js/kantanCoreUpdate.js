/* アップデート機能 */
(function(prototype, ktm){

	document.addEventListener('DOMContentLoaded', function() {
		/* アップデート */
	    updateKantanVersion(document.getElementById("kantanVersion").value);
	    
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
		});
	    
	});
	
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
	
})(prototype, ktm);