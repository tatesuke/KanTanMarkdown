/* アップデート機能 */
(function(prototype, ktm){

	document.addEventListener('DOMContentLoaded', function() {
		/* エディタに機能追加 */
		toKantanEditor(document.getElementById("editor"));
		toKantanEditor(document.getElementById("cssEditor"));
	});

})(prototype, ktm);