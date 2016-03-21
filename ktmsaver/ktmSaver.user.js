// ==UserScript==
// @name         ktmSaverForBrowser
// @namespace    https://github.com/tatesuke/ktmsaver
// @version      0.2
// @description  
// @author       tatesuke
// @match        file:///*/*
// @grant        none
// ==/UserScript==
/* jshint -W097 */
'use strict';

(function() {
    // ローカルファイル以外実行しない
    var url = location.href;
    if (!url.match(/^file:\/\/\//)) {
        return;
    }

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

    // オリジナルのkeydownイベントを退避させる
    var originalEventListener;
    for (var i = 0; i < eventListeners.length; i++) {
        var el = eventListeners[i];
        if ((el.element == document.body) && (el.eventName == "keydown")) {
            originalEventListener = el.callback;
            break;
        }
    }
    document.body.removeEventListener("keydown", originalEventListener);

    // 新しいkeydownイベントを定義
    document.body.addEventListener("keydown", function(event) {
        var code = (event.keyCode ? event.keyCode : event.which);

        if (!isDrawMode() && (code == 83) && (event.ctrlKey || event.metaKey)) {
            // CTRL+Sのみ新しい処理に書き換える
            event.preventDefault();
            queueOverwriteSave();
            return false;
        } else {
            // CTRL+Sはオリジナルそのまま使う
            originalEventListener(event);
        }
    });

    function showKtmSaverUI() {
        var baseButton = document.querySelector("#settingMenuButton");
        if (!baseButton) {
            baseButton = document.querySelector("#onlineMenuButton");
        }
        
        /* 上書き設定ボタン */
        var ktmSaverMenuButton = document.createElement("button");
        ktmSaverMenuButton.innerHTML = "上書き設定";
        ktmSaverMenuButton.style.height = baseButton.offsetHeight;
        ktmSaverMenuButton.style.position = "absolute"
        ktmSaverMenuButton.style.top = baseButton.offsetTop + "px";
        ktmSaverMenuButton.style.left = (baseButton.offsetLeft + baseButton.offsetWidth) + "px";
        on(ktmSaverMenuButton, "click", function() {
            var button = this;
            var menu = document.getElementById("ktmSaverMenu");
            menu.style.top = (this.offsetTop + this.scrollHeight) + "px";
            menu.style.left = this.offsetLeft + "px";
            showBlock(menu);
        });
        document.body.appendChild(ktmSaverMenuButton);

        /* 上書き設定メニュー */
        var ktmSaverMenu = document.createElement("div");
        ktmSaverMenu.classList.add("popupMenu");
        ktmSaverMenu.id  = "ktmSaverMenu";
        ktmSaverMenu.innerHTML =
            '<li>ポート番号:<input type="text" id="ktmServerPort" value="' + getKtmSaverPort() + '">' +
            '<button id="cliseKtmSaverMenuButton">閉じる</button></li>';
        document.body.appendChild(ktmSaverMenu);

        on("#ktmServerPort", "change", function() {
            localStorage.setItem("com.tatesuke.ktmsaver.port", this.value);
        });
        on("#cliseKtmSaverMenuButton", "click", function() {
            hide(ktmSaverMenu);
        });

        /* 接続中メッセージ */
        var connectingMessage = document.createElement("div");
        connectingMessage.innerHTML = "接続中..";
        connectingMessage.id = "ktmSaverConnectingMessage";
        connectingMessage.style.width = "150px";
        connectingMessage.style.height = (baseButton.offsetHeight - 2) + "px";
        connectingMessage.style.position = "absolute";
        connectingMessage.style.top = 0;
        connectingMessage.style.left = ((document.body.offsetWidth / 2) - (150 / 2)) + "px"
        connectingMessage.style.textAlign = "center";
        connectingMessage.style.color = "#c09853";
        connectingMessage.style.backgroundColor = "#fcf8e3";
        connectingMessage.style.border = "1px solid #fbeed5";
        connectingMessage.style.display = "none";
        document.body.appendChild(connectingMessage);

        /* 保存中メッセージ */
        var savingMessage = document.createElement("div");
        savingMessage.innerHTML = "保存中..";
        savingMessage.id = "ktmSaverSavinggMessage";
        savingMessage.style.width = "150px";
        savingMessage.style.height = (baseButton.offsetHeight - 2) + "px";
        savingMessage.style.position = "absolute";
        savingMessage.style.top = 0;
        savingMessage.style.left = ((document.body.offsetWidth / 2) - (150 / 2)) + "px"
        savingMessage.style.textAlign = "center";
        savingMessage.style.color = "#c09853";
        savingMessage.style.backgroundColor = "#fcf8e3";
        savingMessage.style.border = "1px solid #fbeed5";
        savingMessage.style.display = "none";
        document.body.appendChild(savingMessage);

        /* 保存完了メッセージ */
        var sucessMessage = document.createElement("div");
        sucessMessage.innerHTML = "保存完了";
        sucessMessage.id = "ktmSaverSuccessMessage";
        sucessMessage.style.width = "150px";
        sucessMessage.style.height = (baseButton.offsetHeight - 2) + "px";
        sucessMessage.style.position = "absolute";
        sucessMessage.style.top = 0;
        sucessMessage.style.left = ((document.body.offsetWidth / 2) - (150 / 2)) + "px"
        sucessMessage.style.textAlign = "center";
        sucessMessage.style.color = "#3a87ad";
        sucessMessage.style.backgroundColor = "#d9edf7";
        sucessMessage.style.border = "1px solid #bce8f1";
        sucessMessage.style.display = "none";
        document.body.appendChild(sucessMessage);

        /* 保存失敗メッセージ */
        var errorMessage = document.createElement("div");
        errorMessage.innerHTML = "！保存失敗！";
        errorMessage.id = "ktmSaverErrorMessage";
        errorMessage.style.width = "150px";
        errorMessage.style.height = (baseButton.offsetHeight - 2) + "px";
        errorMessage.style.position = "absolute";
        errorMessage.style.top = 0;
        errorMessage.style.left = ((document.body.offsetWidth / 2) - (150 / 2)) + "px"
        errorMessage.style.textAlign = "center";
        errorMessage.style.color = "#b94a48";
        errorMessage.style.backgroundColor = "#f2dede";
        errorMessage.style.border = "1px solid #eed3d7";
        errorMessage.style.display = "none";
        document.body.appendChild(errorMessage);
    }

    function getKtmSaverPort() {
        var port = localStorage.getItem("com.tatesuke.ktmsaver.port");
        if (!port) {
            port = "56565";
        }
        return port;
    }

    
    // 上書き保存
    var overwriteSaveQueue = null;
    var clearMessageQueue = null;
    var queueWait = 50; 
    function queueOverwriteSave() {
        clearTimeout(overwriteSaveQueue);
        clearTimeout(clearMessageQueue);
        overwriteSaveQueue = setTimeout(doOverwriteSave, queueWait);
    }

    function doOverwriteSave() {
        hide(document.querySelector("#ktmSaverSuccessMessage"));
        hide(document.querySelector("#ktmSaverErrorMessage"));
        showBlock(document.querySelector("#ktmSaverConnectingMessage"));

        var data = {
            filePath:decodeURIComponent(location.href.replace(/file:\/\/\//, "")),
            content: getHTMLForSave()
        };

        var port = getKtmSaverPort();
        var ws = new WebSocket('ws://localhost:' + port + '/');
        ws.onopen = function() {
            hide(document.querySelector("#ktmSaverConnectingMessage"));
            showBlock(document.querySelector("#ktmSaverSavinggMessage"));
            ws.send(JSON.stringify(data));
        };

        ws.onmessage = function(event) {
            hide(document.querySelector("#ktmSaverSavinggMessage"));
            showBlock(document.querySelector("#ktmSaverSuccessMessage"));
            clearMessageQueue = setTimeout(function() {
                hide(document.querySelector("#ktmSaverSuccessMessage"));
            }, 3000)
        };

        ws.onerror = function() {
            hide(document.querySelector("#ktmSaverConnectingMessage"));
            hide(document.querySelector("#ktmSaverSavinggMessage"));
            showBlock(document.querySelector("#ktmSaverErrorMessage"));
            alert(data.filePath + "の保存に失敗しました。");
            saved = false;
            doPreview();
        };
    }

})();