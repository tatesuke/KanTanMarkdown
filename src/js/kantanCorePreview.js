/* アップデート機能 */
(function(prototype, ktm){

	document.addEventListener('DOMContentLoaded', function() {
		//更新ボタンを押したら更新する 
		on("#syncButton", "click", ktm.doPreview);

		// エディタに変化があったらプレビュー予約
		on("#editor", "change", ktm.queuePreview);
		on("#editor", "keyup", ktm.queuePreview);
	});
	
	// 自動更新がONならプレビューする
	// ただし、onkeyupなど呼ばれる頻度が高いので一定時間待って最後の呼び出しのみ実行する
	var previewQueue = null; // キューをストック 
	var queuePreviewWait = 300; // 0.3秒後に実行の場合 
	prototype.queuePreview = function() {
		var settingAutoSync = document.getElementById("settingAutoSync");
		if (!settingAutoSync.checked) {
			return;
		}

		// イベント発生の都度、キューをキャンセル 
		clearTimeout( previewQueue );
		 
		// waitで指定したミリ秒後に所定の処理を実行 
		// 経過前に再度イベントが発生した場合
		// キューをキャンセルして再カウント 
		previewQueue = setTimeout(ktm.doPreview, queuePreviewWait);
	}
	
	// 同期実行
	prototype.doPreview = function() {
		// prepreviewedイベントをディスパッチ
		var previewer = document.getElementById("previewer");
		var event = document.createEvent("Event");
		event.initEvent("prepreview", true, true);
		previewer.dispatchEvent(event);

		// スクロールバー下端判定
		var scrollLockFlag = isMaxScroll("previewer");
		
		// マークダウンレンダリング
		previewer.innerHTML = marked(editor.value);
		
		// CSS修正
		var previewerStyle = document.querySelector("#previewerStyle");
		var cssEditor = document.querySelector("#cssEditor");
		var replacedCss = replaceAttachURL(cssEditor.value);
		previewerStyle.innerHTML = replacedCss;
		
		// タイトル変更
		var h1 = document.querySelector("h1");
		if(h1) {
			document.title = h1.textContent;
		} else {
			document.title = "無題";
		}
		if (ktm.isSaved() == false) {
			document.title = "* " + document.title;
		}
		
		// 画像埋め込み
		var images = document.querySelectorAll("#previewer img");
		for (var i = 0; i < images.length; i++) {
			var elem = images[i];
			loadImage(elem);
		}
		
		// リンク
		var anchors = document.querySelectorAll("#previewer a");
		for(i in anchors) {
			var anchor = anchors[i];
			var href = anchor.href;
			if (href) {
				var matchs = href.trim().match(/^attach:(.+)/);
				if (matchs) {
					var name = decodeURIComponent(matchs[1]);
					getFileBlog(name, function(blob){
						var url = window.URL || window.webkitURL;
						var blobUrl = url.createObjectURL(blob);
						anchor.href = blobUrl;
						anchor.download = name;
					});
				}
			}
		}
		
		
		// シーケンス図
		if (typeof Diagram !== "undefined") {
			var sequences = document.getElementsByClassName("sequence");
			for (var i = 0; i < sequences.length; i++) {
				var sequence = sequences[i];
				var diagram = Diagram.parse(sequence.textContent);
				sequence.innerHTML = "";
				diagram.drawSVG(sequence, {theme: 'simple'});
			}
		}
		
		// フローチャート
		if (typeof flowchart !== "undefined") {
			var flows = document.getElementsByClassName("flow");
			for (var i = 0; i < flows.length; i++) {
				var flow = flows[i];
				var diagram = flowchart.parse(flow.textContent);
				flow.innerHTML = "";
				diagram.drawSVG(flow);
			}
		}
		
		// スクロールバーが最下部にある場合、更新後も最下部にする。
		if (scrollLockFlag == true) {
			previewer.scrollTop = previewer.scrollHeight;
		}
		
		// previewedイベントをディスパッチ
		var event = document.createEvent("Event");
		event.initEvent("previewed", true, true);
		previewer.dispatchEvent(event);
	}
	
	function replaceAttachURL(str) {
		var replaced = "";
		var i = 0;
		var prefix = 'url("attach:';
		var surfix = '"';
		var n = prefix.length;
		while (i < str.length) {
			// prefixから始まるなら置き換える
			if ((i + prefix.length) < str.length) {
				var temp = str.substr(i, prefix.length);
				if (temp == prefix) {
					i += prefix.length;
					
					// 名前取得
					var name = "";
					var c = str.charAt(i++);
					while (c != surfix) {
						name += c;
						c = str.charAt(i++);
					}
					
					// 画像があればURLに置き換えて出力
					var url = ktm.getCachedImageUrl(name, true);
					if (url == null) {
						replaced += prefix + name + surfix;
					} else {
						replaced += 'url("' + url.blobOrBase64 + surfix;
					}
					continue;
				}
			}
			
			var c = str.charAt(i++);
			replaced += c;
			
			/* ""で囲まれた文字列ならスキップ */
			if (c == '"') {
				c = str.charAt(i++);
				while (c != '"') {
					replaced += c;
					c = str.charAt(i++);
				};
				replaced += c;
				continue;
			}
		}
		return replaced;
	}
	
	function loadImage(elem) {
		var name = null;
		if (elem.name) {
			name = elem.name;
		} else if (elem.src) {
			var matchs = elem.src.trim().match(/^attach:(.+)/);
			if (matchs) {
				name = decodeURIComponent(matchs[1]);
			}
		}
		
		if (name == null) {
			return;
		}
		
		loadImageByName(
				name,
				function(width, height) {
				 	// 大きさが決まったら仮のイメージで領域だけ確保しておく
					var canvas = document.createElement("canvas");
					canvas.width = width;
					canvas.height = height;
					elem.src = canvas.toDataURL();
				},
				function(imageUrl) {
					elem.src = imageUrl.blobOrBase64;
				});
	}
	
	function loadImageByName(name, onLoadSize, onLoadImage) {
		var base64Script = document.getElementById("attach-" + name);
		if (base64Script != null) {
			var rootElem = base64Script.parentNode;
			var base64 = base64Script.innerHTML;
			var layer64 = rootElem.querySelector("script.layerContent").innerHTML;
			var trimInfo = rootElem.querySelector("script.trimInfo").innerHTML;
			trimInfo = (trimInfo != "") ? JSON.parse(trimInfo) : null;
			
			var cached = ktm.getCachedImageUrl(name, false);
			if (cached) {
				onLoadImage(cached);
				return;
			}
			
			if (trimInfo == null) {
				var url = ktm.cacheImageUrl(name, base64);
				onLoadImage(url);
				return;
			}
			
			onLoadSize(trimInfo.w, trimInfo.h);
			
			var baseImage = new Image();
			baseImage.onload = function() {
				var canvas = document.createElement("canvas");
				canvas.width = trimInfo.w;
				canvas.height = trimInfo.h;
				var ctx = canvas.getContext('2d');
				ctx.translate(-trimInfo.x, -trimInfo.y);
				ctx.drawImage(baseImage,0, 0);
				if (layer64 != "") {
					var layerImage = new Image();
					layerImage.onload = function() {
						ctx.drawImage(layerImage,0, 0);
						
						var content = canvas.toDataURL();
						var url = ktm.cacheImageUrl(name, content);
						onLoadImage(url);
					};
					layerImage.src = layer64;
				} else {
					var content = canvas.toDataURL();
					var url = ktm.cacheImageUrl(name, content);
					onLoadImage(url);
				}
			};
			baseImage.src= base64;
		}
	}
	
	function isMaxScroll (id) {
		var elem = document.getElementById(id);
		
		var scrollHeight = elem.scrollHeight;
		var clientHeight = elem.clientHeight;
		var scrollTop = elem.scrollTop;
		var diff = scrollHeight - (clientHeight + scrollTop)
		
		// 小数点付きの計算なので数ピクセルの誤差を許容する
		return (-1.0 <= diff) && (diff <= 1.0);
	}
	
})(prototype, ktm);