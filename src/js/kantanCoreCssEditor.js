/* アップデート機能 */
(function(prototype, ktm){

	document.addEventListener('DOMContentLoaded', function() {
		/* CSSエディタ変更周り */
		// エディタに変化があったらプレビュー予約
		
		on("#cssEditor", "change", cssChanged);
		on("#cssEditor", "keyup", cssChanged);
		toKantanEditor(document.getElementById("cssEditor"));
	});
	
	function cssChanged() {
		saved = false;
		var title = document.title;
		if (!title.match(/^\*/)) {
			document.title = "* " + title;
		}
	}

})(prototype, ktm);