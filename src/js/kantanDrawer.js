function KantanDrawer (drawArea) {
	var that = this;
	
	this.drawArea = drawArea;
	this.canvasWrapper = drawArea.querySelector("#canvasWrapper");
	this.baseCanvas = drawArea.querySelector("#baseCanvas");
	this.mainCanvas = drawArea.querySelector("#mainCanvas");
	this.workCanvas = drawArea.querySelector("#workCanvas");
	
	this.baseImg = null;
	this.layerImg = null;
	this.trimInfo = null;
	this.borderWidth = "1.0";
	this.borderColor = "#ff0000";
	this.fillColor = "rgba(0, 0, 0, 0)";
	this.scale = 1.0;
	this.commands = [];
	this.workCommands = [];
	
	/* borderWidth */
	var borderWidthInput = drawArea.querySelector("[name=borderWidth]");
	borderWidthInput.value = this.borderWidth;
	borderWidthInput.style.borderBottom = this.borderWidth + "px solid black";
	on(borderWidthInput, "change", function() {
		that.borderWidth = this.value;
		this.style.borderBottom = this.value + "px solid black";
	});

	/* borderColor */
	var borderColorInput = drawArea.querySelector("[name=borderColor]");
	var borderColorPicker = drawArea.querySelector("[name=borderColorPicker]");
	borderColorInput.value = this.borderColor;
	borderColorPicker.value = this.borderColor;
	on(borderColorInput, "blur", function() {
		borderColorPicker.value = this.value;
		that.borderColor = this.value;
	});
	on(borderColorPicker, "change", function() {
		borderColorInput.value = this.value;
		that.borderColor = this.value;
	});

	/* FillColor */
	var fillColorInput = drawArea.querySelector("[name=fillColor]");
	var fillColorPicker = drawArea.querySelector("[name=fillColorPicker]");
	fillColorInput.value = "";
	fillColorPicker.value = "#FFFFFE";
	on(fillColorInput, "blur", function() {
		if (fillColorInput.value == "") {
			fillColorPicker.value = "#FFFFFE";
			that.fillColor = "rgba(0, 0, 0 ,0)";
		} else {
			fillColorPicker.value = this.value;
			that.fillColor = this.value;
		}
	});
	on(fillColorPicker, "change", function() {
		fillColorInput.value = this.value;
		that.fillColor = this.value;
	});
	
	/* scale */
	var scaleInput = drawArea.querySelector("[name=scale]");
	scaleInput.value = this.scale;
	on(scaleInput, "change", function() {
		that.scale = this.value;
		that.repaint();
	});
	
	/* clear */
	var clearButton = drawArea.querySelector("[name=clearButton]");
	on(clearButton, "click", function() {
		
	});

	/* Save */
	var saveButton = drawArea.querySelector("[name=saveButton]")
	on(saveButton, "click", function() {
		var layerData = "";
		var isEmpty = true;
		var mainCtx = that.mainCanvas.getContext("2d");
		var mainData = mainCtx.getImageData(0, 0, that.baseImg.width, that.baseImg.height);
		for (var x = i; i < mainData.data.length; i++) {
			if (mainData.data[i] != 0) {
				isEmpty = false;
				break;
			}
		}
		
		if (!isEmpty) {
			layerData = that.mainCanvas.toDataURL();
		}
		
		hide(that.drawArea);
		that.saveCallback(layerData, JSON.stringify(that.trimInfo));
	});

	/* cancel */
	var cancelButton = drawArea.querySelector("[name=cancelButton]");
	on(cancelButton, "click", function() {
		hide(that.drawArea);
		that.cancelCallback();
	});

	/* モード切替 */
	on(drawArea.querySelector("[name=trimModeButton]"), "click", function(e) {
		that.modeStrategy = new TrimModeStrategy(that);
		that.modeStrategy.onBeforeModeStart(e, that.commands, that.workCommands);
		that.repaint();
	});
	on(drawArea.querySelector("[name=penModeButton]"), "click", function(e) {
		that.modeStrategy = new PenModeStrategy(that);
		that.modeStrategy.onBeforeModeStart(e, that.commands, that.workCommands);
		that.repaint();
	});
	on(drawArea.querySelector("[name=rectangleModeButton]"), "click", function(e) {
		that.modeStrategy = new RectangleModeStrategy(that);
		that.modeStrategy.onBeforeModeStart(e, that.commands, that.workCommands);
		that.repaint();
	});
	on(drawArea.querySelector("[name=eraserModeButton]"), "click", function(e) {
		that.modeStrategy = new EraserModeStrategy(that);
		that.modeStrategy.onBeforeModeStart(e, that.commands, that.workCommands);
		that.repaint();
	});
	on(drawArea.querySelector("[name=letterModeButton]"), "click", function(e) {
		that.modeStrategy = new LetterModeStrategy(that);
		that.modeStrategy.onBeforeModeStart(e, that.commands, that.workCommands);
		that.repaint();
	});


	/* モード制御 */
	on(this.workCanvas, "mousedown", function(e) {
		var x = (e.layerX / that.scale) + that.trimInfo.x;
		var y = (e.layerY / that.scale) + that.trimInfo.y;
		that.modeStrategy.onMouseDown(e, x, y, that.commands, that.workCommands);
	});
	on(this.workCanvas, "mousemove", function(e) {
		var x = (e.layerX / that.scale) + that.trimInfo.x;
		var y = (e.layerY / that.scale) + that.trimInfo.y;
		that.modeStrategy.onMouseMove(e, x, y, that.commands, that.workCommands);
	});
	on(this.workCanvas, "mouseup", function(e) {
		var x = (e.layerX / that.scale) + that.trimInfo.x;
		var y = (e.layerY / that.scale) + that.trimInfo.y;
		that.modeStrategy.onMouseUp(e, x, y, that.commands, that.workCommands);
	});
	
};
KantanDrawer.prototype = {
	show: function(content, layerContent, trimInfoStr, saveCallback, cancelCallback) {
		this.saveCallback = saveCallback;
		this.cancelCallback = cancelCallback;
		this.modeStrategy = new PenModeStrategy(this);
		this.modeStrategy.onBeforeModeStart();
		
		var loadCount = 0;
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
	},
	repaint: function() {
		this.baseCanvas.width  = this.trimInfo.w * this.scale;
		this.baseCanvas.height = this.trimInfo.h * this.scale;
		this.mainCanvas.width  = this.trimInfo.w * this.scale;
		this.mainCanvas.height = this.trimInfo.h * this.scale;
		this.workCanvas.width  = this.trimInfo.w * this.scale;
		this.workCanvas.height = this.trimInfo.h * this.scale;
	
		var baseCtx = this.baseCanvas.getContext("2d");
		baseCtx.clearRect(0, 0, this.baseImg.width, this.baseImg.height);
		baseCtx.save();
		baseCtx.scale(this.scale, this.scale);
		baseCtx.translate(-this.trimInfo.x, -this.trimInfo.y);
		baseCtx.drawImage(this.baseImg,
			0,
			0);
		baseCtx.restore();
		
		var mainCtx = this.mainCanvas.getContext("2d");
		mainCtx.clearRect(0, 0, this.baseImg.width, this.baseImg.height);
		mainCtx.save();
		mainCtx.scale(this.scale, this.scale);
		mainCtx.translate(-this.trimInfo.x, -this.trimInfo.y);
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
	this.paint       = paintFunction;
}

function TrimModeStrategy(drawer){
	this.drawer = drawer;
	this.originalScale = drawer.scale;
	this.originalMode  = drawer.modeStrategy;
	this.mouseStart = null;
};
TrimModeStrategy.prototype = {
	onBeforeModeStart:function(e, commands, workCommands) {
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
			this.drawer.modeStrategy = this.originalMode;
			this.drawer.modeStrategy.onBeforeModeStart();
			
			this.drawer.repaint();
		}
	},
	onBeforeModeEnd: function(e) {
	}
};

function PenModeStrategy(drawer){
	this.drawer = drawer;
	this.isMouseDown = false;
	this.posList = null;
};
PenModeStrategy.prototype = {
	onBeforeModeStart:function() {
		this.posList = [];
	},
	onMouseDown:function(e, x, y, commands, workCommands) {
		if (e.button == 0) {
			var posList = this.posList;
			this.isMouseDown = true;
			this.posList.push({x: x, y : y});
			workCommands.length = 0;
			workCommands.push(new DrawCommand(this.drawer, function(ctx) {
				ctx.beginPath();
				ctx.moveTo(posList[0].x, posList[0].y);
				for (var i = 0; i < posList.length; i++) {
					ctx.lineTo(posList[i].x, posList[i].y);
				}
				ctx.stroke();
			}));
			this.drawer.repaint();
		}
	},
	onMouseMove:function(e, x, y, commands, workCommands) {
		if (this.isMouseDown) {
			this.posList.push({x: x, y : y});
			this.drawer.repaint();
		}
	},
	onMouseUp: function(e, x, y, commands, workCommands) {
		if (e.button == 0) {
			this.posList = [];
			this.isMouseDown = false;
			commands.push(workCommands[0]);
			workCommands.length = 0;
			this.drawer.repaint();
		}
	},
	onBeforeModeEnd: function(e) {
	}
};

function RectangleModeStrategy(drawer){
	this.drawer = drawer;
	this.mouseStart = null;
	this.mouseEnd = null;
};
RectangleModeStrategy.prototype = {
	onBeforeModeStart:function(commands, workCommands) {
		this.mouseStart = null;
		this.mouseEnd = null;
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
	onBeforeModeEnd: function(e) {
	}
};

function EraserModeStrategy(drawer){
	this.drawer = drawer;
	this.mouseStart = null;
	this.mouseEnd = null;
};
EraserModeStrategy.prototype = {
	onBeforeModeStart:function(commands, workCommands) {
		this.mouseStart = null;
		this.mouseEnd = null;
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
	onBeforeModeEnd: function(e) {
	}
};

function LetterModeStrategy(drawer){
	this.drawer = drawer;
	this.mouseStart = null;
	this.mouseEnd = null;
};
LetterModeStrategy.prototype = {
	onBeforeModeStart:function(commands, workCommands) {
		this.mouseStart = null;
		this.mouseEnd = null;
	},
	onMouseDown:function(e, x, y, commands, workCommands) {
		if (e.button == 0) {
			var string = window.prompt("文字を入力してください");
			if (string != null) {
				commands.push(new DrawCommand(this.drawer, function(ctx) {
					ctx.save();
					ctx.fillStyle = this.drawer.borderColor;
					ctx.fillText(string, x, y);
					ctx.restore();
				}));
				this.drawer.repaint();
			}
		}
	},
	onMouseMove:function(e, x, y, commands, workCommands) {
	},
	onMouseUp: function(e, x, y, commands, workCommands) {
	},
	onBeforeModeEnd: function(e) {
	}
};

///* trimモード */
//this.TrimModeStrategy = function(drawer) {
//	this.drawer = drawer;
//	this.originalMode = originalMode;
//	this.isMouseDown = false;
//	this.mouseStart =  null;
//};
//this.TrimModeStrategy.prototype = {
//	onBeforeModeStart:function() {
//		this.drawer.trimInfo = {
//			x: 0,
//			y: 0,
//			w: this.drawer.baseImg.width,
//			h: this.drawer.baseImg.height
//		};
//		setScale(1.0);
//		this.drawer.drawArea.querySelector("[name=scale]").disabled = true;
//		var ctx = this.drawer.workerCanvas.getContext("2d");
//		ctx.clearRect(0, 0, that.workerCanvas.width, that.workerCanvas.height);
//		ctx.fillStyle = "rgba(128, 128, 128, 0.6)";
//		ctx.fillRect(0, 0, that.workerCanvas.width, that.workerCanvas.height);
//	},
//	onMouseDown:function(e) {
//		this.isMouseDown = true;
//		this.mouseStart = {x:e.layerX, y:e.layerY};
//	},
//	onMouseMove:function(e) {
//		if(this.isMouseDown) {
//			var x = e.layerX;
//			var y = e.layerY;
//			
//			var ctx = that.workerCanvas.getContext("2d");
//			ctx.save();
//			ctx.clearRect(0, 0, that.workerCanvas.width, that.workerCanvas.height);
//			ctx.fillStyle = "rgba(128, 128, 128, 0.6)";
//			ctx.fillRect(0, 0, that.workerCanvas.width, that.workerCanvas.height);
//			ctx.clearRect(this.mouseStart.x, this.mouseStart.y, x - this.mouseStart.x, y - this.mouseStart.y);
//		}
//	},
//	onMouseUp: function(e) {
//		this.isMouseDown = false;
//
//		var x = e.layerX;
//		var y = e.layerY;
//		var w = Math.max(this.mouseStart.x, x) - Math.min(this.mouseStart.x, x);
//		var h = Math.max(this.mouseStart.y, y) - Math.min(this.mouseStart.y, y);
//		
//		that.trimInfo = {
//			x: Math.min(this.mouseStart.x, x),
//			y: Math.min(this.mouseStart.y, y),
//			w: w,
//			h: h,
//		};
//		
//		that.modeStrategy = this.originalMode;
//		that.modeStrategy.onBeforeModeStart();
//		
//		drawArea.querySelector("[name=scale]").disabled = false;
//		setScale(drawArea.querySelector("[name=scale]").value);
//	},
//	onBeforeModeEnd: function(e) {
//	}
//};
//
///* ペンモード */
//this.PenModeStrategy = function() {
//	this.isMouseDown = false;
//	this.posList = [];
//};
//this.PenModeStrategy.prototype = {
//	onBeforeModeStart: function(e) {
//	},
//	onMouseDown:function(e) {
//		var x = Math.floor(e.layerX * (1 / that.scale));
//		var y = Math.floor(e.layerY * (1 / that.scale));
//		this.posList.push({x:x, y:y});
//		
//		this.isMouseDown = true;
//		var ctx = that.workerCanvas.getContext("2d");
//		ctx.save();
//		ctx.scale(that.scale, that.scale);
//		ctx.lineWidth = 10;
//		ctx.beginPath();
//		ctx.moveTo(x, y);
//		ctx.restore();
//	},
//	onMouseMove:function(e) {
//		if (this.isMouseDown) {
//			var x = Math.floor(e.layerX * (1 / that.scale));
//			var y = Math.floor(e.layerY * (1 / that.scale));
//			this.posList.push({x:x, y:y});
//			
//			var ctx = that.workerCanvas.getContext("2d");
//			ctx.clearRect(0, 0, that.workerCanvas.width, that.workerCanvas.height);
//			ctx.save();
//			ctx.strokeStyle = that.drawArea.querySelector("[name=borderColor]").value;
//			ctx.lineWidth = that.drawArea.querySelector("[name=borderWidth]").value;
//			ctx.scale(that.scale, that.scale);
//			ctx.lineTo(x, y);
//			ctx.stroke();
//			ctx.restore();
//		}
//	},
//	onMouseUp: function(e) {
//		this.isMouseDown = false;
//		var command = (function(posList){
//			return {
//				exe:function() {
//					var workCtx = that.workerCanvas.getContext("2d");
//					workCtx.clearRect(0, 0, workerCanvas.width, workerCanvas.height);
//					var mainCtx = that.mainCanvas.getContext("2d");
//					mainCtx.save();
//					mainCtx.strokeStyle = that.drawArea.querySelector("[name=borderColor]").value;
//					mainCtx.scale(that.scale, that.scale);
//					mainCtx.beginPath();
//					mainCtx.moveTo(posList[0].x, posList[0].y);
//					for (var i = 1; i < posList.length; i++) {
//						mainCtx.lineTo(posList[i].x, posList[i].y);
//					}
//					mainCtx.stroke();
//					mainCtx.restore();
//				}
//			};
//		})(this.posList);
//		command.exe();
//		that.commands.push(command);
//		this.posList = [];
//	},
//	onBeforeModeEnd: function(e) {
//	}
//};
//
//
//
///* 直線モード */
//var LineModeStrategy = function() {};
//LineModeStrategy.prototype = {
//	isMouseDown: false,
//	mouseStart:  null,
//	onBeforeModeStart: function(e) {
//	},
//	onMouseDown:function(e) {
//		this.isMouseDown = true;
//		this.mouseStart = {x: e.layerX, y: e.layerY};
//	},
//	onMouseMove:function(e) {
//		if (this.isMouseDown) {
//			var ctx = workerCanvas.getContext("2d");
//			ctx.clearRect(0, 0, workerCanvas.width, workerCanvas.height);
//			ctx.beginPath();
//			ctx.moveTo(this.mouseStart.x, this.mouseStart.y);
//			ctx.lineTo(e.layerX, e.layerY);
//			ctx.stroke();
//		}
//	},
//	onMouseUp: function(e) {
//		this.isMouseDown = false;
//		
//		var workCtx = workerCanvas.getContext("2d");
//		workCtx.clearRect(0, 0, workerCanvas.width, workerCanvas.height);
//
//		var mainCtx = mainCanvas.getContext("2d");
//		mainCtx.beginPath();
//		mainCtx.moveTo(this.mouseStart.x, this.mouseStart.y);
//		mainCtx.lineTo(e.layerX, e.layerY);
//		mainCtx.stroke();
//	},
//	onBeforeModeEnd: function(e) {
//	}
//};
//
///* 円モード */
//var CircleModeStrategy = function() {};
//CircleModeStrategy.prototype = {
//	onBeforeModeStart: function(e) {
//	},
//	onMouseDown:function(e) {
//	},
//	onMouseMove:function(e) {
//	},
//	onMouseUp: function(e) {
//	},
//	onBeforeModeEnd: function(e) {
//	}
//};
//
///* 四角モード */
//var RectangleModeStrategy = function() {};
//RectangleModeStrategy.prototype = {
//	onBeforeModeStart: function(e) {
//	},
//	onMouseDown:function(e) {
//	},
//	onMouseMove:function(e) {
//	},
//	onMouseUp: function(e) {
//	},
//	onBeforeModeEnd: function(e) {
//	}
//};
//
///* 文字モード */
//var LetterModeStrategy = function() {};
//LetterModeStrategy.prototype = {
//	onBeforeModeStart: function(e) {
//	},
//	onMouseDown:function(e) {
//	},
//	onMouseMove:function(e) {
//	},
//	onMouseUp: function(e) {
//	},
//	onBeforeModeEnd: function(e) {
//	}
//};
//
///* 消しゴムモード */
//var EraserModeStrategy = function() {};
//EraserModeStrategy.prototype = {
//	onBeforeModeStart: function(e) {
//	},
//	onMouseDown:function(e) {
//	},
//	onMouseMove:function(e) {
//	},
//	onMouseUp: function(e) {
//	},
//	onBeforeModeEnd: function(e) {
//	}
//};

