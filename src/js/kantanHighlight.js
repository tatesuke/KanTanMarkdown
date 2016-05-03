/* アップデート機能 */
(function(prototype, ktm){

	document.addEventListener('DOMContentLoaded', function() {
		/* シンタックスハイライト設定 */
		if (typeof hljs !== "undefined") {
			marked.setOptions({
				highlight: function (code, lang) {
					return hljs.highlightAuto(code, [lang]).value;
				}
			});
		}
	});
	
})(prototype, ktm);