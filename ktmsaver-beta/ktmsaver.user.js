// ==UserScript==
// @name         ktmSaverForBrowser
// @namespace    https://github.com/tatesuke/ktmsaver
// @version      0.8
// @description  かんたんMarkdownで上書きを可能にするためのユーザスクリプト
// @author       tatesuke
// @match        http://tatesuke.github.io/KanTanMarkdown/**
// @match        file:///*/*
// @grant        none
// ==/UserScript==
/* jshint -W097 */
'use strict';

(function() {
    // かんたんMarkdownでなければ実行しない
    var isKantanMarkdown = document.querySelector("#kantanVersion");
    if (!isKantanMarkdown) {
        return;
    }

    // getHTMLForSave関数がないバージョンでは実行しない
    if (!getHTMLForSave) {
        return;
    }

    // UIを構築
    showKtmSaverUI();

    // ファイルパス取得
    var url = location.href;
    var filePath;
    setFilePath((url.match(/^file:\/\//)) ? decodeURIComponent(url.substr(7)) : "");
    function setFilePath(path) {
        if (path) {
            filePath = path;
            document.querySelector("#ktmSaverCurrentFilePath").innerHTML = filePath;
        } else {
            filePath = "";
            document.querySelector("#ktmSaverCurrentFilePath").innerHTML = "未保存";
        }
    }

    // 保存ボタンとショートカットキーのオリジナルのイベントを退避させる
    var saveButton = document.querySelector("#saveButton");
    var originalSaveButtonEvent;
    for (var i = 0; i < eventListeners.length; i++) {
        var el = eventListeners[i];
        if ((el.element == saveButton) && (el.eventName == "click")) {
            originalSaveButtonEvent = el.callback;
            break;
        }
    }
    saveButton.removeEventListener("click", originalSaveButtonEvent);

    var originalShrtcutKeyEvent;
    for (var i = 0; i < eventListeners.length; i++) {
        var el = eventListeners[i];
        if ((el.element == document.body) && (el.eventName == "keydown")) {
            originalShrtcutKeyEvent = el.callback;
            break;
        }
    }
    document.body.removeEventListener("keydown", originalShrtcutKeyEvent);

    // 新しい保存ボタンクリックイベント
    var isSaveButtonUsed = false;
    on(saveButton, "click", function(){
        var confirm = window.confirm(
            "保存ボタンで保存を実行した場合、新しいファイルパスを取得することができないため、ファイルを開きなおすまでCtrl+Sによる上書き保存はできなくなります。\n" +
            "「Ctrl+,」で表示されるメニューから「名前を付けて保存」を選択すればこの問題は発生しません。\n\n" + 
            "それでもこのボタンから実行しますか？");
        if (confirm == true) {
            isSaveButtonUsed = true;
            showKTMSaverMessage("WARN", "上書き保存利用不可");
            return originalSaveButtonEvent();
        }
    });

    // 新しいショートカットキーイベントを定義
    on(document.body, "keydown", function(event) {
        var code = (event.keyCode ? event.keyCode : event.which);

        if (!isDrawMode() && (code == 83) && (event.ctrlKey || event.metaKey)) {
            // CTRL+Sのみ新しい処理に書き換える
            event.preventDefault();

            if (isSaveButtonUsed) {
                return originalSaveButtonEvent();
            } else if (!saved || filePath === "") {
                queueOverwriteSave();
            }

            return false;
        } 

        if (code == 188 && event.ctrlKey){
            // CTRL+,で設定画面
            event.preventDefault();
            showBlock(ktmSaverMenu);
            ktmSaverMenu.style.top = ((document.body.offsetHeight / 2) - (ktmSaverMenu.offsetHeight / 2)) + "px";
            ktmSaverMenu.style.left = ((document.body.offsetWidth / 2) - (ktmSaverMenu.offsetWidth / 2)) + "px";
            return false;
        }

        if (code == 188 && event.ctrlKey){
            // CTRL+,で設定画面
            event.preventDefault();
            showBlock(ktmSaverMenu);
            ktmSaverMenu.style.top = ((document.body.offsetHeight / 2) - (ktmSaverMenu.offsetHeight / 2)) + "px";
            ktmSaverMenu.style.left = ((document.body.offsetWidth / 2) - (ktmSaverMenu.offsetWidth / 2)) + "px";
            return false;
        }

        if (code == 27 && isVisible(ktmSaverMenu)){
            event.preventDefault();
            hide(ktmSaverMenu);
            ktmSaverMenu.style.top = ((document.body.offsetHeight / 2) - (ktmSaverMenu.offsetHeight / 2)) + "px";
            ktmSaverMenu.style.left = ((document.body.offsetWidth / 2) - (ktmSaverMenu.offsetWidth / 2)) + "px";
            return false;
        }

        // 上記以外はオリジナルそのまま使う
        return originalShrtcutKeyEvent(event);

    });

    function showKtmSaverUI() {
        /* KTMSaverメニュー */
        var ktmSaverMenu = document.createElement("div");
        ktmSaverMenu.classList.add("popupMenu");
        ktmSaverMenu.id  = "ktmSaverMenu";
        ktmSaverMenu.innerHTML =
            '<ul>' + 
            '<li id="ktmSaverCurrentFilePath"></li>' +
            '<li><hr></li>' +
            '<li><a href="#" id="ktmSaverOverwriteSaveButton">上書き保存(Ctrl + S)</a></li>' +
            '<li><a href="#" id="ktmSaverSaveAsButton">名前を付けて保存</a></li>' +
            '<li><hr></li>' + 
            '<li>クライアントAppポート番号:<input type="text" id="ktmSaverPort" value="' + getItem("ktmSaverPort", "56565") + '"></li>' +
            '<li><hr></li>' + 
            '<li><input type="checkbox" id="ktmSaverBackupEnabled" ' + getItem("ktmSaverBackupEnabled", "checked") + '>' + 
            '<label for="ktmSaverBackupEnabled">上書きするときにファイルをバックアップ</label></li>' +
            '<li>バックアップ保存先:<input type="text" id="ktmSaverBackupDir" value="' + getItem("ktmSaverBackupDir", "./") + '"></li>' +
            '<li>バックアップ世代数:<input type="number" id="ktmSaverBackupGeneration" min="0" value="' + getItem("ktmSaverBackupGeneration", "0") + '">' +
            '(0以下で無制限)</li>' +
            '<li><button id="cliseKtmSaverMenuButton">閉じる</button></li>' +
            '</ul>';
        document.body.appendChild(ktmSaverMenu);

        on("#ktmSaverSaveAsButton", "click", function(){
            queueSaveAs();
            return false;
        });

        on("#ktmSaverOverwriteSaveButton", "click", function(){
            queueOverwriteSave();
            return false;
        });

        on("#ktmSaverPort, #ktmSaverBackupDir, #ktmSaverBackupGeneration", "change", function() {
            setItem(this.id, this.value);
        });

        on ("#ktmSaverBackupEnabled", "change", function() {
            console.log("change")
            setItem(this.id, (this.checked) ? "checked" : "");
        });

        on("#cliseKtmSaverMenuButton", "click", function(event) {
            hide(ktmSaverMenu);
        });
    }

    function getItem(name, defaultValue) {
        var value = localStorage.getItem("com.tatesuke.ktmsaver." + name);
        return (value != null) ? value : defaultValue;
    }

    function setItem(name, value) {
        localStorage.setItem("com.tatesuke.ktmsaver." + name, value);
    }

    // メッセージ表示用関数
    function showKTMSaverMessage(type, msg, time) {
        // エレメントを削除
        var elements = document.querySelectorAll(".ktmSavarMessage");
        for (var i = 0; i < elements.length; i++) {
            var element = elements[i];
            document.body.removeChild(element);
        }

        // エレメント生成
        var messageElement = document.createElement("div");
        messageElement.innerHTML = msg;
        messageElement.classList.add("ktmSavarMessage");
        messageElement.style.height = "19px";
        messageElement.style.position = "absolute";
        messageElement.style.textAlign = "center";
        messageElement.style.paddingRight = "10px";
        messageElement.style.paddingLeft = "10px";

        // 種別により色を変化させる
        if (type == "INFO") {
            messageElement.style.color = "#3a87ad";
            messageElement.style.backgroundColor = "#d9edf7";
            messageElement.style.border = "1px solid #bce8f1";
        } else if (type == "WARN") {
            messageElement.style.color = "#c09853";
            messageElement.style.backgroundColor = "#fcf8e3";
            messageElement.style.border = "1px solid #fbeed5";
        } else {
            messageElement.style.color = "#b94a48";
            messageElement.style.backgroundColor = "#f2dede";
            messageElement.style.border = "1px solid #eed3d7";
        }

        // 表示
        document.body.appendChild(messageElement);
        layoutKTMSaverMessage();

        // timeが渡ってきていれば非表示タイマーセット
        if (time) {
            setTimeout(function() {
                messageElement.style.display="none";
            }, time);
        }
    }

    function layoutKTMSaverMessage() {
        var elements = document.querySelectorAll(".ktmSavarMessage");
        for (var i = 0; i < elements.length; i++) {
            var element = elements[i];
            element.style.left = "0px";
            element.style.top = (window.innerHeight - element.offsetHeight - 2) + "px";
        }
    }

    on(window, "resize", function() {
        layoutKTMSaverMessage();
    });

    // 保存用WebSocket
    var port = document.querySelector("#ktmSaverPort").value;
    var ws = new WebSocket('ws://localhost:' + port + '/ktmsaver/save');
    showKTMSaverMessage("WARN", "ローカルAPPに接続中...");

    ws.onopen = function() {
        showKTMSaverMessage("INFO", "上書き保存を利用できます。設定は「Ctrl+,」", 3000);
    };

    ws.onerror = function(e) {
        showKTMSaverMessage("WARN", "!上書き保存は利用できません。設定は「Ctrl+,」!");
    };

    window.onbeforeunload = function() {
        ws.close();
        if (!saved) {
            return "ドキュメントが保存されていません。"
        }
    }

    // 名前を付けて保存
    var saveAsQueue = null;
    var queueWait = 1; 
    function queueSaveAs() {
        clearTimeout(saveAsQueue);
        saveAsQueue = setTimeout(doSaveAs, queueWait);
    }
    function doSaveAs () {
        showKTMSaverMessage("WARN", "HTML生成中...");

        var html = getHTMLForSave();

        var title = "無題";
        var titleElement = document.querySelector("h1");
        if (titleElement) {
            title = titleElement.innerText;
        }

        var data = {};
        data.action   = "SAVE_AS";
        data.fileDir  = null;
        data.fileName = title + ".html";
        data.backupEnabled = document.querySelector("#ktmSaverBackupEnabled").checked; 
        data.backupDir     = document.querySelector("#ktmSaverBackupDir").value;
        data.backupGeneration = document.querySelector("#ktmSaverBackupGeneration").value;

        doSave(data);
    }

    // 上書き保存
    var overwriteSaveQueue = null;
    function queueOverwriteSave() {
        clearTimeout(overwriteSaveQueue);
        overwriteSaveQueue = setTimeout(doOverwriteSave, queueWait);
    }

    function doOverwriteSave() {
        showKTMSaverMessage("WARN", "HTML生成中...");

        var html = getHTMLForSave();

        if (filePath == "") {
            doSaveAs();
        } else {
            var data = {};
            var pos = filePath.lastIndexOf("/");
            pos = (pos == -1) ? filePath.lastIndexOf("\\") : pos;
            data.action = "OVERWRITE";
            data.fileDir = filePath.substring(0, pos);
            data.fileName = filePath.substr(pos + 1);
            data.backupEnabled = document.querySelector("#ktmSaverBackupEnabled").checked; 
            data.backupDir     = document.querySelector("#ktmSaverBackupDir").value;
            data.backupGeneration = document.querySelector("#ktmSaverBackupGeneration").value;

            doSave(data);
        }
    }

    function doSave(data) {
        if (ws.readyState == WebSocket.OPEN) {
            // 送信
            showKTMSaverMessage("WARN", "保存中...");
            ws.onmessage = onmessage;
            ws.send(JSON.stringify(data));
            ws.send(str2buff(getHTMLForSave()));
        } else {
            // 切断されていたら再接続
            showKTMSaverMessage("WARN", "再接続中...");    
            port = document.querySelector("#ktmSaverPort").value;
            ws = new WebSocket('ws://localhost:' + port + '/ktmsaver/save');
            ws.onopen = function () {
                doSave(data);
            }
            return;
        }
        ws.onerror = function(e) {
            showKTMSaverMessage("ERROR", "!保存失敗!");  
            alert("保存に失敗しました。クライアントAppとの接続中にエラーが発生しました。\n" +
                  "クライアントAppが起動しているか、ポート番号があっているかなど確認してください。");
            saved = false;
            doPreview();
        };
    }

    function onmessage (event) { 
        var result = JSON.parse(event.data);

        if (!result.result) {
            showKTMSaverMessage("ERROR", "!保存失敗!");
            alert("保存に失敗した可能性があります" + result.message);
            saved = false;
            doPreview();
        } else if (result.result == "SUCCESS") {
            showKTMSaverMessage("INFO", result.filePath + "に保存しました", 1500);
            setFilePath(result.filePath);
        } else if (result.result == "CANCEL") {
            showKTMSaverMessage("WARN", "キャンセル", 1500);
            setFilePath(filePath);
            saved = false;
            doPreview();
        } else if (result.result == "ERROR") {
            showKTMSaverMessage("ERROR", "!保存失敗!");
            alert("保存に失敗しました。\n" + result.message);
            setFilePath(filePath);
            saved = false;
            doPreview();
        } else {
            showKTMSaverMessage("ERROR", "!保存失敗!");
            alert("保存に失敗した可能性があります。\n" + result.message);
            saved = false;
            doPreview();
        }
    };

    var str2buff = function(str){
        var ab_ = new ArrayBuffer(new Blob([str]).size);
        var bytes_ = new Uint8Array(ab_);

        var n = str.length,
            idx = -1,
            i, c;

        for(i = 0; i < n; ++i){
            c = str.charCodeAt(i);
            if(c <= 0x7F){
                bytes_[++idx] = c;
            } else if(c <= 0x7FF){
                bytes_[++idx] = 0xC0 | (c >>> 6);
                bytes_[++idx] = 0x80 | (c & 0x3F);
            } else if(c <= 0xFFFF){
                bytes_[++idx] = 0xE0 | (c >>> 12);
                bytes_[++idx] = 0x80 | ((c >>> 6) & 0x3F);
                bytes_[++idx] = 0x80 | (c & 0x3F);
            } else {
                bytes_[++idx] = 0xF0 | (c >>> 18);
                bytes_[++idx] = 0x80 | ((c >>> 12) & 0x3F);
                bytes_[++idx] = 0x80 | ((c >>> 6) & 0x3F);
                bytes_[++idx] = 0x80 | (c & 0x3F);
            }
        }
        return bytes_;
    }


    })();