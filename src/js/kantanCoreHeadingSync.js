/* アップデート機能 */
(function(prototype, ktm){

	document.addEventListener('DOMContentLoaded', function() {
		
	});
	
	/* 見出し同期 */
	on("#headingSyncButton", "click", headingSyncToPreviewer);

	on("#previewer", "previewed", function(e) {
		if (ktm.isEditMode()) {
			var headings = e.target.querySelectorAll("h1, h2, h3, h4, h5, h6");
			for (var i = 0; i < headings.length; i++) {
				// 見出しにイベントを設定する。メモリリーク対策でプレビュー時に
				// イベントを外しやすくするために、on**で実装する。 
				headings[i].onmouseover = function(){
					this.style.cursor = "pointer";
				}
				headings[i].onclick = headingSyncToEditor;
			}
		}
	});
	
	on("#previewer", "prepreview", function(e) {
		var headings = document.getElementById("previewer")
				.querySelectorAll("h1, h2, h3, h4, h5, h6");
		for (var i = 0; i < headings.length; i++) {
			headings[i].onmouseover = null;
			headings[i].onclick = null;
		}
	});

	function headingSyncToPreviewer() {
		var editor = document.getElementById("editor");
		var previewer = document.getElementById("previewer");
		
		var num = getCurrentNumberOfHeading(editor);
		scrollPreviewerToHeading(previewer, num);
	}

	function headingSyncToEditor(e) {
		var editor = document.getElementById("editor");
		var previewer = document.getElementById("previewer");
		var num = getNumberOfHeading(previewer, e.target);
		scrollEditorToHeading(editor, num);
	}

	function getNumberOfHeading(previewer, elem) {
		var headings = previewer.querySelectorAll("h1, h2, h3, h4, h5, h6");
		var i;
		for (i = 0; i < headings.length; i++) {
			if (headings[i] == elem) {
				break;
			}
		}
		return i + 1;
	}

	function scrollEditorToHeading(editor, num) {
		var value = editor.value;
		var processedLines = processForHeadingSync(value, value.length);

		
		var headingCount = 0;
		var i;
		for (var i = 0; i < processedLines.length; i++) {
			var line = processedLines[i];
			if (line.match(/^# .+$/)) {
				headingCount++;
				
				if (headingCount == num) {
					break;
				}
			}
		}
		
		var j = 0;
		if (i != 0) {
			var lineBreakCount = 0;
			for (j = 0; j < value.length ; j++) {
				var c = value.charAt(j);
				if (c == "\n") {
					lineBreakCount++;
					if (lineBreakCount == i) {
						j++;
						break;
					}
				}
			}
		}
		
		var end = editor.value.indexOf("\n", j);
		end = (end == -1) ? editor.value.length : end;
		
		editor.selectionStart = j;
		editor.selectionEnd = end;
		updateScrollPos(editor);
		// chromeだとupdateScrollPosのバグで強制的にsaved=trueになってしまう
		// そのため、updateSavedFlagを呼び出して元に戻す。
		// TODO いつか治したい
		ktm.updateSavedFlag();
		editor.focus();
	}

	function getCurrentNumberOfHeading(editor) {
		var value = editor.value;
		
		// ==や--によるheadingに対応するため
		// キャレットの次の行まで読み込む
		var length = editor.selectionStart;
		var lineBreakCount = 0;
		while ((length < value.length) && (lineBreakCount < 2)) {
			if (value.charAt(length) == "\n") {
				lineBreakCount++;
			}
			length++;
		}
		length--;
		
		var processed = processForHeadingSync(value, length);
		if ((lineBreakCount == 2)
				&& processed[processed.length - 1].match(/^#{1,6}\s(.+)$/)) {
			// キャレットの次の行がheadingだったらそれは捨てる
			processed.pop();
		}
		return processed.join().split("# ").length - 1;
	}

	function scrollPreviewerToHeading(previewer, numberOfHeading) {
		if (numberOfHeading == 0) {
			previewer.scrollTop = 0;
		} else {
			var hElems = previewer.querySelectorAll("h1, h2, h3, h4, h5, h6");
			var elem = hElems[numberOfHeading - 1];
			previewer.scrollTop = elem.offsetTop - previewer.offsetTop;
		}
	}

	function processForHeadingSync(str, length) {
		var text = str.substring(0, length);
		var lines = text.split("\n");
		var newLines = [];
		
		var style = editor.currentStyle 
				|| document.defaultView.getComputedStyle(editor, '');
		var tabSize = style.tabSize
					|| style.MozTabSize
					|| 8;
		tabSize = Number(tabSize);
		
		var tildeCodeBlockFlag = false;
		var backQuoteCodeBlockFlag = false;
		var i;
		for (i = 0; i < lines.length; i++) {
			var line = lines[i];
			// 行頭にtabSize以上のスペースがある行は削除
			line = line.replace(new RegExp("^ {" + tabSize + ",}.*"), "");
			// 行頭にtabがある行は削除
			line = line.replace(/^\t+.*/, "");
			// trim
			line = line.replace(/^\s+|\s+$/g, "");
			// 行頭のblockquoteは削除
			line = line.replace(/^\s*(>\s*)+/, "");
			
			if (tildeCodeBlockFlag == true) {
				if (line == "~~~") {
					tildeCodeBlockFlag = false;
				}
				newLines.push("");
				continue;
			}
			if (backQuoteCodeBlockFlag == true) {
				if (line == "```") {
					backQuoteCodeBlockFlag = false;
				}
				newLines.push("");
				continue;
			}
			
			if (line.substring(0, 3) == "~~~"){
				tildeCodeBlockFlag = true;
				newLines.push("");
				continue;
			}
			if (line.substring(0, 3) == "```"){
				backQuoteCodeBlockFlag = true;
				newLines.push("");
				continue;
			}
			
			if (line.match(/^={2,}$|^-{2,}$/)
					&& !newLines[i - 1].match(/^#{1,6}\s(.+)$/)
					&& (newLines[i - 1] != "")) {
				newLines[i - 1] = "# " + newLines[i - 1];
				newLines.push("");
				continue;
			}
			if (line.match(/^#{1,6}\s(.+)$/)
				|| line.match(/^<h[1-6]>(.*)$/)) {
				newLines.push("# " + RegExp.$1);
				continue;
			}
			
			newLines.push(line.replace(/#/g, ""));
		}

		return newLines;
	}

})(prototype, ktm);