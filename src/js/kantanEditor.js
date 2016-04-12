function toKantanEditor(editor) {
	/* tabキーでtabを入力 */
	on(editor, 'keydown', function(e) {
		if ((e.which != 9) && (e.keyCode != 9)) {
			return true;
		}
		e.preventDefault();
		
		var start = editor.selectionStart;
		var end   = editor.selectionEnd;
		if (start == end) {
			/* いわゆる普通のtab */
			var text = editor.value;
			var insertString;
			if (document.querySelector("#settingExpandtab").checked) {
				insertString = "";
				var tabSize = 4;
				var posOfLine = 0;
				var i = start;
				// 行頭まで遡り
				while ((0 < i) && (text.charAt(i - 1) != "\n")) {
					i--;
				}
				// 行の何文字目か調べる
				for (; i < start; i++) {
					var c = text.charCodeAt(i);
					// 半角判定はざっくりと256未満と半角カナのみ
					if (c == 9) {
						posOfLine += tabSize - (posOfLine % tabSize);
					} else if (c < 256 || (c >= 0xff61 && c <= 0xff9f)) {
						posOfLine += 1;
					} else {
						posOfLine += 2;
					}
				}
				// 行の何文字目かに応じてスペースを挿入する
				var spaceNum = tabSize - (posOfLine % tabSize);
				for (var j = 0; j < spaceNum; j++) {
					insertString += " ";
				}
			} else {
				insertString = "\t"
			}
			
			editor.value = text.substr(0, start) + insertString + text.substr(start, text.length);
			editor.setSelectionRange(start + insertString.length, start + insertString.length);
			updateScrollPos(e.target);
			saveUndo(e.target);
		} else {
			if (e.shiftKey) {
				/* 選択 + Shift + Tabで複数行アウトデント */
				var tabSize = 4;
				
				// スタート・エンド位置特定
				var orgText = editor.value;
				while ((0 < start) && (orgText.charAt(start - 1) != "\n")) {
					start--;
				}
				if (orgText.charAt(end - 1) == "\n") {
					end -= 1;
				}
				while ((end < orgText.length) && (orgText.charAt(end) != "\n")) {
					end++;
				}
				end--;
				
				var deleteCount = 0;
				var newText = orgText.substring(0, start);
				var i = start;
				while (i < end) {
					var c = orgText.charAt(i);
					var spaceCount = 0;
					while (spaceCount < tabSize) {
						if (c == " ") {
							spaceCount += 1;
							deleteCount++;
						} else if (c == " ") {
							spaceCount += 2;
							deleteCount++;
						} else if (c == "\t") {
							spaceCount += tabSize;
							deleteCount++;
						} else {
							newText += c;
							i++;
							break;
						}
						c = orgText.charAt(++i);
					}
					while ((c != "\n") && (i < end)) {
						c = orgText.charAt(i++);
						newText += c;
					} 
				}
				newText += orgText.substr(end)
				
				editor.value = newText;
				
				editor.selectionStart = start;
				editor.selectionEnd   = end - deleteCount + 1;
				updateScrollPos(e.target);
				saveUndo(e.target);
			} else {
				/* 選択 + Tabで複数行インデント */
				
				// スタート・エンド位置特定
				var orgText = editor.value;
				while ((0 < start) && (orgText.charAt(start - 1) != "\n")) {
					start--;
				}
				if (orgText.charAt(end - 1) == "\n") {
					end -= 1;
				}
				while ((end < orgText.length) && (orgText.charAt(end) != "\n")) {
					end++;
				}
				
				// タブ挿入
				var count = 1;
				var newText = orgText.substring(0, start) + "\t";
				for (var i = start; i < end; i++) {
					var c = orgText.charAt(i);
					newText += c;
					if (c == "\n") {
						newText += "\t";
						count++;
					}
				}
				newText += orgText.substr(end);
				
				// テキスト入れ替え
				editor.value = newText;
				
				// 選択位置修正
				editor.selectionStart = start;
				editor.selectionEnd   = end + count;
				updateScrollPos(e.target);
				saveUndo(e.target);
			}
		}
		
		return false;
	});
	
	/* オートインデント */
	on(editor, 'keydown', function(e) {
		
		// Enterキー
		if (e.which == 13 || e.keyCode == 13) {
			e.preventDefault();
			
			// 行頭か先頭に至るまでさかのぼる
			var count = 0;
			var text = editor.value;
			var pos = editor.selectionStart;
			while ((0 < pos) && (text.charAt(pos - 1) != "\n")) {
				pos--;
				count++;
			}
			
			// 先頭の空白文字を記憶
			var spaces = "";
			for (var i = 0; i < count; i++) {
				var c = text.charAt(pos + i);
				if((c != " ") && (c !=  "　") && (c != "\t")) {
					break;
				}
				spaces += c;
			}			
			
			// 改行＋スペース（タブ）の挿入
			var newPos = editor.selectionStart + spaces.length + 1;
			var part1 = text.substring(0, editor.selectionStart);
			var part2 = text.substr(editor.selectionEnd);
			editor.value = part1 + "\n" + spaces + part2;
			
			editor.selectionStart = newPos;
			editor.selectionEnd = newPos;
			updateScrollPos(e.target);
			
			saveUndo(e.target);
		}
	});

	/* /キーで閉じタグを入力 */
	on(editor, 'keydown', function(e) {
		// `/`キー以外なら終了
		if (((e.which != 191) && (e.keyCode != 191)) 
				|| (e.shiftKey || e.ctrlKey || e.metaKey || e.altKey)) {
			return true;
		}
		
		// 閉じタグ挿入がoffなら終了
		if (!document.querySelector("#settingAutoCloseTab").checked) {
			return true;
		}
		
		// 一文字前が`<`以外だったら終了
		var editor = e.target;
		var pos = editor.selectionStart - 1;
		if ((pos < 0) || (editor.value.charAt(pos) != "<")) {
			return true;
		}
		pos--;
		
		// 一文字ずつ遡りながら直近の閉じてないタグを探す
		var unclosedTagName = null;
		var closeTagStack = [""];
		while (0 <= pos) {
			if (editor.value.charAt(pos) != "<") {
				pos--;
				continue;
			}
			
			var isCloseTag;
			var tagNamePos;
			if (editor.value.charAt(pos + 1) == "/") {
				isCloseTag = true;
				tagNamePos = pos + 2;
			} else {
				isCloseTag = false;
				tagNamePos = pos + 1;
			}
			
			var currentTagName = getTagNameAt(editor, tagNamePos);
			
			if (isCloseTag) {
				closeTagStack.push(currentTagName);
			} else {
				if (currentTagName == closeTagStack[closeTagStack.length - 1]) {
					closeTagStack.pop();
				} else {
					unclosedTagName = currentTagName;
					break;
				}
			}
		
			pos--;
		}
		
		if (unclosedTagName == null) {
			return true;
		} else {
			e.preventDefault();
			var insertText = "/" + unclosedTagName + ">";
			var newPos = editor.selectionStart + insertText.length;
			var part1 = editor.value.substring(0, editor.selectionStart);
			var part2 = editor.value.substr(editor.selectionEnd);
			editor.value = part1 + insertText + part2;
			
			editor.selectionStart = newPos;
			editor.selectionEnd = newPos;
			updateScrollPos(e.target);
			
			saveUndo(e.target);
			return false;
		}
	});
	
	function getTagNameAt(editor, pos) {
		var tagName = "";
		var c = editor.value.charAt(pos);
		while ((c != ">") && (c != " ")) {
			tagName = tagName + c;
			pos++;
			c = editor.value.charAt(pos);
		}
		return tagName;
	}

	/* Undo, Redo */
	var isCtrlVDowning = false;
	var keyCache = {};
	var undoStack = [];
	var redoStack = [];
	var previousVal = {val:editor.value, selectionStart:undefined, selectionEnd:undefined};
	var valueAtArrowOrClick = undefined;
	on(editor, "keydown", function(e){
		if (e.code == "Enter") {
			saveUndo(e.target);
		} else if ((e.which == 86 || e.keyCode == 86) && (e.ctrlKey || e.metaKey) && !isCtrlVDowning) {
			// Ctrl + vの前にundoできるようにする
			saveUndoAfterPaste(e.target);
			isCtrlVDowning = true;
		} else if ((e.which == 86 || e.keyCode == 86) && (e.ctrlKey || e.metaKey) && isCtrlVDowning) {
			// Ctrl + vを押しっぱなしの時は普通のundo(#73 fix)
			saveUndo(e.target);
		} 
		var code = (e.keyCode ? e.keyCode : e.which);
		if ((33 <= code) && (code <= 40)) {
			// PageUp, Pagedown, Home, End, 矢印キーはIME OFF判定
			keyCache[e.code] = true;
		}
	});
	on(editor, "keypress", function(e){
		// keypressが発生するキーはIME OFFと判定
		keyCache[e.code] = true;
	});
	on(editor, "keyup", function(e){
		if ((e.which == 13 || e.keyCode == 13)                          // ENTER
				|| (e.which == 8 || e.keyCode == 8)                      // BS
				|| (e.which == 46 || e.keyCode == 46)                    // DELETE
				|| ((e.which == 86 || e.keyCode == 86) && (e.ctrlKey || e.metaKey))     // Ctrl+v
				|| ((e.which == 88 || e.keyCode == 88) && (e.ctrlKey || e.metaKey))) {  //Ctrl+x
			
			saveUndo(e.target);
		} else if (keyCache[e.code] == true) {
			// keypressが発生していた(IME OFF)なら、Undo可能にする
			
			var code = (e.keyCode ? e.keyCode : e.which);
			if ((33 <= code) && (code <= 40)) {
				// PageUp, Pagedown, Home, End, 矢印キー
				valueAtArrowOrClick = {
					val: editor.value,
					selectionStart: editor.selectionStart,
					selectionEnd: editor.selectionEnd
				};
				keyCache[e.code] = false;
			} else {
				keyCache[e.code] = false;
				saveUndo(e.target);
			}
		}
		// Ctrl+Vを離したらフラグを下げる
		if (!e.ctrlKey && !e.metaKey && isCtrlVDowning) {
			isCtrlVDowning = false;
		}
	});
	on(editor, "changeByJs", function(e){
		saveUndo(e.target);
	});
	
	on(editor, "mouseup", function(e) {
		valueAtArrowOrClick = {
			val: editor.value,
			selectionStart: editor.selectionStart,
			selectionEnd: editor.selectionEnd
		};
	});
	
	on(editor, "keydown", function(e) {
		// Ctrl+Z
		if (e.keyCode == 90 && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
			e.preventDefault();
			
			if (0 < undoStack.length) {
				redoStack.push(previousVal);
				
				var undo = undoStack.pop();
				editor.value = undo.val;
				editor.selectionStart = undo.selectionStart;
				editor.selectionEnd   = undo.selectionEnd;
				updateScrollPos(e.target);
				previousVal = undo;
				triggerInputEvent(editor);
			}
		}
	});
	
	on(editor, "keydown", function(e) {
		// Ctrl+Y or Ctrl + Shift + Z or Cmd + Shift + Z
		if ((e.keyCode == 89 && (e.ctrlKey || e.metaKey))
				|| (e.keyCode == 90 && e.ctrlKey && e.shiftKey)
				|| (e.keyCode == 90 && e.metaKey && e.shiftKey)) {
			e.preventDefault();
			
			if (0 < redoStack.length) {
				undoStack.push(previousVal);
				previousVal = redoStack.pop();
				editor.value = previousVal.val;
				editor.selectionStart = previousVal.selectionStart;
				editor.selectionEnd   = previousVal.selectionEnd;
				updateScrollPos(e.target);
				triggerInputEvent(editor);
			}
		}
	});
	
	var saveUndo = function(editor) {
		if (previousVal.val != editor.value) {
			if(valueAtArrowOrClick) {
				undoStack.push(valueAtArrowOrClick);
				valueAtArrowOrClick = undefined;
			} else {
				undoStack.push(previousVal);
			}
			
			redoStack = [];
			previousVal = {
				val: editor.value,
				selectionStart: editor.selectionStart,
				selectionEnd  : editor.selectionEnd
			}
		}
	}
	
	var saveUndoAfterPaste = function(editor) {
		redoStack = [];
		previousVal = {
			val: editor.value,
			selectionStart: editor.selectionStart,
			selectionEnd  : editor.selectionEnd
		}
	}
	/* 共通関数 */
	
	// スクロールバー位置更新
	// chromeやIEではjsで値を変更してキャレットが画面の外に出ても
	// スクロールバーが追従しないのを何とかする関数
	var updateScrollPos = function(editor) {
		// 初期状態を保存
		var text = editor.value;
		var selectionStart = editor.selectionStart;
		var selectionEnd   = editor.selectionEnd;
	
		// insertTextコマンドで適当な文字(X)の追加を試みる
		var isInsertEnabled;
		try {
			isInsertEnabled = document.execCommand("insertText", false, "X");
		} catch(e) {
			// IE10では何故かfalseを返さずに例外が発生するのでcatchで対応する
			isInsertEnabled = false;
		}
		
		if (isInsertEnabled) {
			// insertTextに成功したらChrome
			// chromeはどう頑張ってもまっとうな手段が通用しない。
			// 苦肉の策としてselectionStart,endを揃えてから
			// 一旦フォーカスを外してすぐに戻す。そうするとスクロールバーが追従する
			// これにより、chromeではblurやfocusイベントはまともに使えなくなる黒魔術
			editor.value = text;
			editor.selectionStart = selectionStart;
			editor.selectionEnd = selectionStart;
			editor.blur();
			editor.focus();
			
			// valは戻してあるのでキャレット位置のみ元に戻す
			editor.selectionStart = selectionStart;
			editor.selectionEnd = selectionEnd;
		} else {
			// IE,FirefoxはinsertTextに失敗するのでval関数で適当な文字(X)を挿入する。
			// IEではその後にその文字を選択してdeleteコマンドで削除するとスクロールバーが追従する
			var part1 = text.substring(0, selectionStart);
			var part2 = text.substr(selectionEnd);
			editor.value = part1 + "X" + part2;
			editor.selectionStart = part1.length;
			editor.selectionEnd = part1.length + 1;
			var isDeleteEnabled = document.execCommand("delete", false, null);
			
			// 追従した後はvalとキャレットを元に戻す
			editor.value = text;
			editor.selectionStart = selectionStart;
			editor.selectionEnd = selectionEnd;
		}
	}
	
	var triggerInputEvent = function (editor) {
		var ev = document.createEvent("Event");
		ev.initEvent("input", true, true);
		editor.dispatchEvent(ev);
	}
}