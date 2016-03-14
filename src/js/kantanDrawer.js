function KantanDrawer (drawArea) {
	var that = this;
	
	this.drawArea = drawArea;
	this.canvasWrapper = drawArea.querySelector("#canvasWrapper");
	this.baseCanvas = drawArea.querySelector("#baseCanvas");
	this.mainCanvas = drawArea.querySelector("#mainCanvas");
	this.workCanvas = drawArea.querySelector("#workCanvas");
	
	/* モード切替 */
	var modeButtons = drawArea.querySelectorAll(".mode button");
	for (var i = 0; i < modeButtons.length; i++) {
		on(modeButtons[i], "click", function(e) {
			var index = this.name.indexOf("ModeButton");
			var modeName = this.name.substring(0, index);
			that.setMode(modeName);
		});
	}
	
	/* borderWidth */
	var borderWidthElem = drawArea.querySelector("[name=borderWidth]");
	on(drawArea.querySelector(".borderWidth [name=minus]"), "click", function() {
		that.setBorderWidth(that.borderWidth - 1);
	});
	on(drawArea.querySelector(".borderWidth [name=plus]"), "click", function() {
		that.setBorderWidth(that.borderWidth + 1);
	});

	/* borderColor */
	var borderColorInput = drawArea.querySelector("[name=borderColor]");
	on(borderColorInput, "keyup", function() {
		that.setBorderColor(this.value);
	});
	var borderColors = drawArea.querySelectorAll(".borderColor .color");
	for (var i = 0; i < borderColors.length; i++) {
		on(borderColors[i], "click", function(){
			var color = this.name.substr(2);
			if (color == "clear") {
				color = "rgba(0, 0, 0, 0)";
			} else {
				color = "#" + color;
			}
			that.setBorderColor(color);
		});
	}
	
	/* FillColor */
	var fillColorInput = drawArea.querySelector("[name=fillColor]");
	on(fillColorInput, "keyup", function() {
		that.setFillColor(this.value);
	});
	var fillColors = drawArea.querySelectorAll(".fillColor .color");
	for (var i = 0; i < fillColors.length; i++) {
		on(fillColors[i], "click", function(){
			var color = this.name.substr(2);
			if (color == "clear") {
				color = "rgba(0, 0, 0, 0)";
			} else {
				color = "#" + color;
			}
			that.setFillColor(color)
		});
	}
	
	/* font */
	var fontInput = drawArea.querySelector("[name=font]");
	on(fontInput, "keyup", function() {
		that.font = this.value;
	});
	
	/* scale */
	var slaceElem = drawArea.querySelector("[name=scale]");
	on(drawArea.querySelector(".scale [name=minus]"), "click", function() {
		that.setScale(that.scale - 0.1);
		that.repaint();
	});
	on(drawArea.querySelector(".scale [name=plus]"), "click", function() {
		that.setScale(that.scale + 0.1);
		that.repaint();
	});
	
	/* undo,redo */
	on(drawArea.querySelector("[name=undoButton]"), "click", function() {
		if (that.commands.length != 0) {
			var top = that.commands.pop();
			that.redoCommands.push(top);
			that.repaint();
		}
	});
	on(drawArea.querySelector("[name=redoButton]"), "click", function() {
		if (that.redoCommands.length != 0) {
			var command = that.redoCommands.pop();
			that.commands.push(command);
			that.repaint();
		}
	});
	
	/* Reset */
	var resetButton = drawArea.querySelector("[name=resetButton]");
	on(resetButton, "click", function() {
		var confirm = window.confirm(
				"全ての描画をリセットしますか？この操作は元に戻せません。");
		if (confirm == true) {
			that.reset();
			that.repaint();
		}
	});

	/* Save */
	var saveButton = drawArea.querySelector("[name=saveButton]")
	on(saveButton, "click", function() {
		var layerData = "";
		var isEmpty = true;
		var mainCtx = that.mainCanvas.getContext("2d");
		var mainData = mainCtx.getImageData(0, 0, that.baseImg.width, that.baseImg.height);
		for (var i = 0; i < mainData.data.length; i++) {
			if (mainData.data[i] != 0) {
				isEmpty = false;
				break;
			}
		}
		
		if (!isEmpty) {
			var tempCanvas = document.createElement("canvas");
			tempCanvas.width = that.baseImg.width;
			tempCanvas.height = that.baseImg.height;
			tempCtx = tempCanvas.getContext("2d");
			tempCtx.putImageData(mainData, that.trimInfo.x, that.trimInfo.y);
			layerData = tempCanvas.toDataURL();
		}
		
		that.hide();
		that.saveCallback(layerData, JSON.stringify(that.trimInfo));
		that.reset();
	});

	/* cancel */
	var cancelButton = drawArea.querySelector("[name=cancelButton]");
	on(cancelButton, "click", function() {
		var confirm = window.confirm("キャンセルしてもいいですか？編集内容は失われます。");
		if (confirm == true) {
			that.hide();
			that.reset();
			that.cancelCallback();
		}
	});

	/* モード制御 */
	on(this.workCanvas, "mousedown", function(e) {
		var originalLength = that.commands.length;
		var x = (e.layerX / that.scale) + that.trimInfo.x;
		var y = (e.layerY / that.scale) + that.trimInfo.y;
		that.modeStrategy.onMouseDown(e, x, y, that.commands, that.workCommands);
		if (originalLength != that.commands.length) {
			that.redoCommands = [];
		}
	});
	on(this.workCanvas, "mousemove", function(e) {
		var originalLength = that.commands.length;
		var x = (e.layerX / that.scale) + that.trimInfo.x;
		var y = (e.layerY / that.scale) + that.trimInfo.y;
		that.modeStrategy.onMouseMove(e, x, y, that.commands, that.workCommands);
		if (originalLength != that.commands.length) {
			that.redoCommands = [];
		}
	});
	on(this.workCanvas, "mouseup", function(e) {
		var originalLength = that.commands.length;
		var x = (e.layerX / that.scale) + that.trimInfo.x;
		var y = (e.layerY / that.scale) + that.trimInfo.y;
		that.modeStrategy.onMouseUp(e, x, y, that.commands, that.workCommands);
		if (originalLength != that.commands.length) {
			that.redoCommands = [];
		}
	});
	
};
KantanDrawer.prototype = {
	show: function(content, layerContent, trimInfoStr, saveCallback, cancelCallback) {
		this.saveCallback = saveCallback;
		this.cancelCallback = cancelCallback;
	
		var that = this;
		this.baseImg = new Image();
		this.baseImg.onload = function() {
			if (trimInfoStr.trim() != "") {
				that.trimInfo = JSON.parse(trimInfoStr); 
			} else {
				that.trimInfo = {x:0, y:0, w:this.width, h:this.height}
			}
			
			if (layerContent.trim() != "") {
				that.layerImg = new Image();
				that.layerImg.onload = function() {
					showBlock(that.drawArea);
					that.repaint();
				};
				that.layerImg.src = layerContent;
			} else {
				showBlock(that.drawArea);
				that.repaint();
			}
		};
		this.baseImg.src = content;
		this.reset();
	},
	hide: function() {
		this.baseImg = null;
		this.layerImg = null;
		hide(this.drawArea);
	},
	reset:function() {
		this.commands = [];
		this.redoCommands = [];
		this.workCommands = [];
		this.layerImg = null;
		this.trimInfo = {
				x: 0,
				y: 0,
				w: this.baseImg.width,
				h: this.baseImg.height,};
		this.setMode("rectangle");
		this.setBorderWidth(1.0);
		this.setBorderColor("#ff0000");
		this.setFillColor("rgba(0, 0, 0, 0)");
		this.setFont("18px sans-serif");
		this.setScale(1.0);
	},
	setMode: function(modeName) {
		if (modeName == "rectangle") {
			this.modeStrategy = new RectangleModeStrategy(this);
			this.modeStrategy.onBeforeModeStart(this.commands, this.workCommands);
		} else if (modeName == "letter") {
			this.modeStrategy = new LetterModeStrategy(this);
			this.modeStrategy.onBeforeModeStart(this.commands, this.workCommands);
		} else if (modeName == "eraser") {
			this.modeStrategy = new EraserModeStrategy(this);
			this.modeStrategy.onBeforeModeStart(this.commands, this.workCommands);
		} else if (modeName == "trim") {
			if (this.trimInfo.x == 0
					&& this.trimInfo.y == 0
					&& this.trimInfo.w == this.baseImg.width
					&& this.trimInfo.h == this.baseImg.height) {
				this.modeStrategy = new TrimModeStrategy(this);
				this.modeStrategy.onBeforeModeStart(this.commands, this.workCommands);
			} else {
				this.trimInfo = {
					x: 0,
					y: 0,
					w: this.baseImg.width,
					h: this.baseImg.height,
				}
				this.repaint();
			}
		} else {
			throw "未知のモード" + modeName;
		}
		
		var modeButtons = drawArea.querySelectorAll(".mode button");
		for (var i = 0; i < modeButtons.length; i++) {
			modeButtons[i].classList.remove("selected");
		}
		var modeButton = drawArea.querySelector(".mode button[name=" + this.modeStrategy.modeName + "ModeButton]")
				.classList.add("selected");
	},
	setBorderWidth: function (borderWidth) {
		var borderWidthElem = drawArea.querySelector("[name=borderWidth]");
		if (1 <= borderWidth) {
			this.borderWidth = borderWidth;
		}
		borderWidthElem.textContent = this.borderWidth;
		borderWidthElem.style.borderBottom = this.borderWidth + "px solid black";
	},
	setBorderColor: function(borderColor) {
		var borderColorInput = drawArea.querySelector("[name=borderColor]");
		this.borderColor = borderColor;
		borderColorInput.value = borderColor;
		borderColorInput.style.backgroundColor = borderColor;
	},
	setFillColor: function(fillColor) {
		var fillColorInput = drawArea.querySelector("[name=fillColor]");
		this.fillColor = fillColor;
		fillColorInput.value = fillColor;
		fillColorInput.style.backgroundColor = fillColor;
	},
	setFont: function(font) {
		var fontInput = drawArea.querySelector("[name=font]");
		this.font = font;
		fontInput.value = font;
	},
	setScale: function(scale) {
		var slaceElem = drawArea.querySelector("[name=scale]");
		if (0.1 <= scale) {
			this.scale = scale;
		}
		slaceElem.textContent = this.scale;
	},
	repaint: function() {
		this.baseCanvas.width = 
				this.mainCanvas.width = 
				this.workCanvas.width = this.trimInfo.w * this.scale;
				
		this.baseCanvas.height = 
				this.mainCanvas.height =
				this.workCanvas.height = this.trimInfo.h * this.scale;
		
		var trimModeButton = this.drawArea.querySelector("[name=trimModeButton]");
		if (this.trimInfo.x == 0
				&& this.trimInfo.y == 0
				&& this.trimInfo.w == this.baseImg.width
				&& this.trimInfo.h == this.baseImg.height) {
			trimModeButton.textContent = "Trim";
		} else {
			trimModeButton.textContent = "Reset Trim";
		}
		
		var baseCtx = this.baseCanvas.getContext("2d");
		baseCtx.clearRect(0, 0, this.baseImg.width, this.baseImg.height);
		baseCtx.save();
		baseCtx.scale(this.scale, this.scale);
		baseCtx.translate(-this.trimInfo.x, -this.trimInfo.y);
		baseCtx.drawImage(this.baseImg, 0, 0);
		baseCtx.restore();
		
		var mainCtx = this.mainCanvas.getContext("2d");
		mainCtx.clearRect(0, 0, this.baseImg.width, this.baseImg.height);
		mainCtx.save();
		mainCtx.scale(this.scale, this.scale);
		mainCtx.translate(-this.trimInfo.x, -this.trimInfo.y);
		if (this.layerImg) {
			mainCtx.drawImage(this.layerImg, 0, 0);
		}
		for (var i = 0; i < this.commands.length; i++) {
			var command = this.commands[i];
			mainCtx.strokeStyle = command.strokeStyle;
			mainCtx.lineWidth   = command.lineWidth;
			mainCtx.fillStyle   = command.fillStyle;
			command.paint(mainCtx);
		} 
		mainCtx.restore();
		
		var workCtx = this.workCanvas.getContext("2d");
		workCtx.clearRect(0, 0, this.baseImg.width, this.baseImg.height);
		workCtx.save();
		workCtx.scale(this.scale, this.scale);
		workCtx.translate(-this.trimInfo.x, -this.trimInfo.y);
		for (var i = 0; i < this.workCommands.length; i++) {
			var command = this.workCommands[i];
			workCtx.strokeStyle = command.strokeStyle;
			workCtx.lineWidth   = command.lineWidth;
			workCtx.fillStyle   = command.fillStyle;
			command.paint(workCtx);
		}
		workCtx.restore();
	}
}

function DrawCommand(drawer, paintFunction) {
	this.drawer      = drawer;
	this.strokeStyle = drawer.borderColor;
	this.lineWidth   = drawer.borderWidth;
	this.fillStyle   = drawer.fillColor;
	this.width       = drawer.baseImg.width;
	this.height      = drawer.baseImg.height;
	this.font        = drawer.font;
	this.paint       = paintFunction;
}

function TrimModeStrategy(drawer){
	this.modeName = "trim";
	this.drawer = drawer;
	this.originalScale = drawer.scale;
	this.originalMode  = drawer.modeStrategy.modeName;
	this.mouseStart = null;
};
TrimModeStrategy.prototype = {
	onBeforeModeStart:function(commands, workCommands) {
		this.drawer.scale = 1.0;
		this.drawer.trimInfo = {
			x: 0,
			y: 0,
			w: this.drawer.baseImg.width,
			h: this.drawer.baseImg.height,
		};
		
		workCommands.length = 0;
		workCommands.push(new DrawCommand(this.drawer, function(ctx) {
			ctx.save();
			ctx.borderStyle = "rgba(0, 0, 0, 0.6)";
			ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
			ctx.clearRect(0, 0, this.width, this.height);
			ctx.fillRect(0, 0, this.width, this.height);
			ctx.restore();
		}));
		this.drawer.repaint();
	},
	onMouseDown:function(e, x, y, commands, workCommands) {
		this.mouseStart = {x: x, y : y};
	},
	onMouseMove:function(e, x, y, commands, workCommands) {
		if (this.mouseStart != null) {
			var that = this;
			workCommands.length = 0;
			workCommands.push(new DrawCommand(this.drawer, function(ctx) {
				ctx.save();
				ctx.borderStyle = "rgba(0, 0, 0, 0.6)";
				ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
				
				ctx.fillRect(0, 0, this.width, this.height);
				ctx.clearRect(
					that.mouseStart.x,
					that.mouseStart.y,
					x - that.mouseStart.x,
					y - that.mouseStart.y
				);
				
				ctx.restore();
			}));
			this.drawer.repaint();
		}
	},
	onMouseUp: function(e,x, y, commands, workCommands) {
		if (e.button == 0) {
			var startX = Math.min(this.mouseStart.x, x);
			var startY = Math.min(this.mouseStart.y, y);
			var w = Math.max(this.mouseStart.x, x) - startX;
			var h = Math.max(this.mouseStart.y, y) - startY;
			this.drawer.trimInfo.x = startX;
			this.drawer.trimInfo.y = startY;
			this.drawer.trimInfo.w = w;
			this.drawer.trimInfo.h = h;
			
			this.mouseStart = null;
			workCommands.length = 0;
			this.drawer.scale = this.originalScale;
			this.drawer.setMode(this.originalMode);
			this.drawer.repaint();
		}
	},
};

function RectangleModeStrategy(drawer){
	this.modeName = "rectangle";
	this.drawer = drawer;
	this.mouseStart = null;
	this.mouseEnd = null;
};
RectangleModeStrategy.prototype = {
	onBeforeModeStart:function(commands, workCommands) {
		this.mouseStart = null;
		this.mouseEnd = null;
		workCommands.length = 0;
		this.drawer.repaint();
	},
	onMouseDown:function(e, x, y, commands, workCommands) {
		if (e.button == 0) {
			this.mouseStart = {x: x, y : y};
			this.mouseEnd = {x: x, y : y};
			
			var mouseStart = this.mouseStart;
			var mouseEnd = this.mouseEnd;
			workCommands.length = 0;
			workCommands.push(new DrawCommand(this.drawer, function(ctx) {
				ctx.fillRect(
					mouseStart.x,
					mouseStart.y,
					mouseEnd.x - mouseStart.x,
					mouseEnd.y - mouseStart.y);
				ctx.strokeRect(
					mouseStart.x,
					mouseStart.y,
					mouseEnd.x - mouseStart.x,
					mouseEnd.y - mouseStart.y);
			}));
			this.drawer.repaint();
		}
	},
	onMouseMove:function(e, x, y, commands, workCommands) {
		if (this.mouseStart != null) {
			this.mouseEnd.x = x;
			this.mouseEnd.y = y;
			this.drawer.repaint();
		}
	},
	onMouseUp: function(e, x, y, commands, workCommands) {
		if ((this.mouseStart != null) && (e.button == 0)) {
			this.mouseStart = null;
			this.mouseEnd = null;
			commands.push(workCommands[0]);
			workCommands.length = 0;
			this.drawer.repaint();
		}
	},
};

function EraserModeStrategy(drawer){
	this.modeName = "eraser";
	this.drawer = drawer;
	this.mouseStart = null;
	this.mouseEnd = null;
};
EraserModeStrategy.prototype = {
	onBeforeModeStart:function(commands, workCommands) {
		this.mouseStart = null;
		this.mouseEnd = null;
		workCommands.length = 0;
		this.drawer.repaint();
	},
	onMouseDown:function(e, x, y, commands, workCommands) {
		if (e.button == 0) {
			this.mouseStart = {x: x, y : y};
			this.mouseEnd = {x: x, y : y};
			
			var mouseStart = this.mouseStart;
			var mouseEnd = this.mouseEnd;
			workCommands.length = 0;
			workCommands.push(new DrawCommand(this.drawer, function(ctx) {
				ctx.strokeStyle = "#808080";
				ctx.strokeRect(
					mouseStart.x,
					mouseStart.y,
					mouseEnd.x - mouseStart.x,
					mouseEnd.y - mouseStart.y);
			}));
			this.drawer.repaint();
		}
	},
	onMouseMove:function(e, x, y, commands, workCommands) {
		if (this.mouseStart != null) {
			this.mouseEnd.x = x;
			this.mouseEnd.y = y;
			this.drawer.repaint();
		}
	},
	onMouseUp: function(e, x, y, commands, workCommands) {
		if ((this.mouseStart != null) && (e.button == 0)) {
			var mouseStart = this.mouseStart;
			var mouseEnd = this.mouseEnd;
			workCommands.length = 0;
			commands.push(new DrawCommand(this.drawer, function(ctx) {
				ctx.clearRect(
					mouseStart.x,
					mouseStart.y,
					mouseEnd.x - mouseStart.x,
					mouseEnd.y - mouseStart.y);
			}));
			this.mouseStart = null;
			this.mouseEnd = null;
			this.drawer.repaint();
		}
	},
};

function LetterModeStrategy(drawer){
	this.modeName = "letter";
	this.drawer = drawer;
	this.mouseStart = null;
	this.mouseEnd = null;
};
LetterModeStrategy.prototype = {
	onBeforeModeStart:function(commands, workCommands) {
		this.mouseStart = null;
		this.mouseEnd = null;
		workCommands.length = 0;
		this.drawer.repaint();
	},
	onMouseDown:function(e, x, y, commands, workCommands) {
	},
	onMouseMove:function(e, x, y, commands, workCommands) {
	},
	onMouseUp: function(e, x, y, commands, workCommands) {
		if (e.button == 0) {
			var string = window.prompt("文字を入力してください");
			if (string != null) {
				commands.push(new DrawCommand(this.drawer, function(ctx) {
					ctx.save();
					ctx.font = this.font;
					ctx.fillStyle = this.strokeStyle;
					ctx.fillText(string, x, y);
					ctx.restore();
				}));
				this.drawer.repaint();
			}
		}
	},
};

