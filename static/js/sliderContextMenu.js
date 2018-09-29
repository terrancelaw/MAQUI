var SliderContextMenu = {
	slider: null,
	min: null, // stored for changing time widget
	max: null, // stored for changing time widget

	init: function() {
		var self = this;

		self.initSlider();
		self.initConfirmButton();
		self.initCancelButton();
		self.initHandleValues();
		self.initDragSliderBehaviour();
		self.initClickHandleTextBehaviour();
		self.initDropDownMenuBehaviour();
		self.initTimeWidgetBehaviour();
	},
	hide: function() {
		$("#slider-context-menu")
			.css("display", "none");
	},
	show: function(top, left) {
		$("#slider-context-menu")
			.css("display", "block")
			.css("top", top)
			.css("left", left);
	},
	empty: function() {
		var self = this;

		self.updateSliderMinMax(0, 10);
		self.updateSliderValues([ 2, 8 ]);
		self.updateHandles();
		self.removeHandlesAndMinMaxText();

		$("#slider-context-menu .attribute.content select").empty();
		$("#slider-context-menu .range.header .time-unit-widget select").val("sec");
	},
	displayAttributeList: function(attributeList, selectedAttrName = null) {
		for (var i = 0; i < attributeList.length; i++) {
			var attributeName = attributeList[i].attributeName;
			var attributeType = attributeList[i].attributeType;
			var numericalOrCategorical = attributeList[i].numericalOrCategorical;
			var optionHTML = "<option value='" + attributeName + "' name='" + attributeName + "' attributeType='" + attributeType + "' numericalOrCategorical='" + numericalOrCategorical + "'>" + 
								attributeName +
							 "</option>";

			$("#slider-context-menu .attribute.content select").append(optionHTML);
		}

		if (selectedAttrName)
			$("#slider-context-menu .attribute.content select").val(selectedAttrName);
	},
	updateTimeUnitWidget: function() {
		var currentOptionIsTime = $("#slider-context-menu .attribute.content select").val() == "time";
		var display = currentOptionIsTime ? "" : "none";

		$("#slider-context-menu .range.header .time-unit-widget")
			.css("display", display);
	},
	retrieveAndUpdateMinMax: function(panelID, ForSID, outputType, attributeName) {
		var self = this;

		WebAPI.getMinMax(panelID, ForSID, outputType, attributeName, afterGettingMinMax);

		function afterGettingMinMax(response) {
			var min = response.min;
			var max = response.max;
			var step = response.step;
			var lowerHandleValue = min + ((max - min) * 0.2);
			var upperHandleValue = max - ((max - min) * 0.2);

			self.min = min;
			self.max = max;
			self.updateSliderMinMax(min, max);
			self.updateSliderValues([ lowerHandleValue, upperHandleValue ]);
			self.updateSliderStep(step);
			self.updateHandles();
			self.updateMinMaxText();
		}
	},
	initSlider: function() {
		var self = this;

		self.slider = $("#slider-context-menu #slider")
			.slider({ tooltip: "hide", min: 0, max: 10, value: [2, 8] });
	},
	initConfirmButton: function() {
		var self = this;

		$("#slider-context-menu .footer .confirm-btn").click(clickConfirmButton);

		function clickConfirmButton() {
			var selectedAttrName = $("#slider-context-menu .attribute.content option:selected").val();
			var minHandleValue = self.slider.slider("getValue")[0];
			var maxHandleValue = self.slider.slider("getValue")[1];
			var panelID = ContextMenu.targetPanelID;
			var ForSID = ContextMenu.targetForSID;
			var displayString = "";

			if (selectedAttrName == "time") {
				var unit = $("#slider-context-menu .range.header .time-unit-widget select").val();
				var minUnit = minHandleValue > 1 && unit != "sec" ? (unit + "s") : unit;
				var maxUnit = maxHandleValue > 1 && unit != "sec" ? (unit + "s") : unit;

				displayString = minHandleValue + minUnit + "<=time<=" + maxHandleValue + maxUnit;
				minHandleValue = Helper.computeTimeInSec(minHandleValue, unit);
				maxHandleValue = Helper.computeTimeInSec(maxHandleValue, unit);
			}

			WebAPI.createSimpleNumericalFilter(panelID, ForSID, selectedAttrName, minHandleValue, maxHandleValue, displayString, afterCreatingSimpleFilter);
			self.hide();
		}

		function afterCreatingSimpleFilter(response) {
			var updatedPanelID = response.updatedPanelID;
			var minifiedFandS = response.minifiedFandS;
			var updatedPanelEl = $("#subsequence-view .panel[panel-id=" + updatedPanelID + "]")[0];

			FandSManager.update(minifiedFandS);
			FunnelVis.update(updatedPanelEl);
			Timeline.update(updatedPanelEl);
			RecordAttributeBar.update(updatedPanelEl);
		}
	},
	initCancelButton: function() {
		var self = this;

		$("#slider-context-menu .footer .cancel-btn").click(clickCancelButton);

		function clickCancelButton() {
			self.hide();
		}
	},
	initHandleValues: function() {
		var self = this;
		var minHandleLeft = $("#slider-context-menu .range.content #slider .min-slider-handle").position().left;
		var minHandleValue = self.slider.slider("getValue")[0];
		var maxHandleLeft = $("#slider-context-menu .range.content #slider .max-slider-handle").position().left
		var maxHandleValue = self.slider.slider("getValue")[1];

		// add the lines and the values
		$("#slider-context-menu .range.content #slider")
			.prepend("<div class='min-handle-line'></div>");
		$("#slider-context-menu .range.content #slider")
			.prepend("<div class='max-handle-line'></div>");
		$("#slider-context-menu .range.content #slider")
			.prepend("<span class='min-handle-text'></span>");
		$("#slider-context-menu .range.content #slider")
			.prepend("<span class='max-handle-text'></span>");

		// init the lines and the values
		$("#slider-context-menu .range.content .min-handle-line")
			.css("bottom", "9px")
			.css("left", minHandleLeft);
		$("#slider-context-menu .range.content .max-handle-line")
			.css("top", "50%")
			.css("left", maxHandleLeft);
		$("#slider-context-menu .range.content .min-handle-text")
			.css("bottom", "49px")
			.css("left", minHandleLeft)
			.css("transform", "translateX(-50%)")
			.html(minHandleValue);
		$("#slider-context-menu .range.content .max-handle-text")
			.css("top", "calc(50% + 39px)")
			.css("left", maxHandleLeft)
			.css("transform", "translateX(-50%)")
			.html(maxHandleValue);
	},
	initDragSliderBehaviour: function() {
		var self = this;

		self.slider.slider("on", "change", function() {
			self.updateHandles();
		});
	},
	initClickHandleTextBehaviour: function() {
		var self = this;
		var handleTextSelector = "#slider-context-menu .range.content .min-handle-text, #slider-context-menu .range.content .max-handle-text";
		var slideRangeEditorSelector = "#slider-range-editor";

		Body.registerClickEvent(handleTextSelector, slideRangeEditorSelector, clickHandleText);
		Body.registerNotClickEvent(slideRangeEditorSelector, updateSlider);
		initEnterTextEditorBehaviour();

		function initEnterTextEditorBehaviour() {
			$("#slider-range-editor")
				.keypress(function(event) {
				    if(event.which == 13)
				        updateSlider(event);
				});
		}

		function clickHandleText(event) {
			var clickedLowerText = $(event.target).hasClass("min-handle-text");
			var handleTextBbox = event.target.getBoundingClientRect();
			var handleTextValue = clickedLowerText ? self.slider.slider("getValue")[0] : self.slider.slider("getValue")[1];
			var whichTextClicked = clickedLowerText ? "lower" : "upper";

			$("#slider-range-editor")
				.attr("which-text-clicked", whichTextClicked)
				.attr("original-value", handleTextValue)
				.css("display", "block")
				.css("min-width", handleTextBbox.width)
				.css("width", handleTextBbox.width)
				.css("height", handleTextBbox.height)
				.css("top", handleTextBbox.top)
				.css("left", handleTextBbox.left)
				.val(handleTextValue);

			$("#slider-range-editor")
				.select();
		}

		function updateSlider(event) {
			if ($("#slider-range-editor").css("display") == "none")
				return;

			var whichTextChanged = $("#slider-range-editor").attr("which-text-clicked");
			var originalValue = $("#slider-range-editor").attr("original-value");
			var currentValue = $("#slider-range-editor").val();
			var isInputEmpty = currentValue == "";

			if (originalValue != currentValue && !isInputEmpty) {
				var value1 = null, value2 = null, newRange = null;

				if (whichTextChanged == "lower") {
					value1 = self.slider.slider("getValue")[1];
					value2 = parseFloat(currentValue);
					newRange = [Math.min(value1, value2), Math.max(value1, value2)];
				}
				if (whichTextChanged == "upper") {
					value1 = self.slider.slider("getValue")[0];
					value2 = parseFloat(currentValue);
					newRange = [Math.min(value1, value2), Math.max(value1, value2)];
				}

				self.updateSliderValues(newRange);
				self.updateHandles();
			}

			$("#slider-range-editor")
				.css("display", "none");
		}
	},
	initDropDownMenuBehaviour: function() {
		$("#slider-context-menu .attribute.content select").change(changeDropDownMenu);

		function changeDropDownMenu() {
			var value = $(this).find(":selected").text();

			ContextMenu.changeAttributeMenu(value);
		}
	},
	initTimeWidgetBehaviour: function() {
		var self = this;

		$("#slider-context-menu .range.header .time-unit-widget select").change(changeTimeUnit);

		function changeTimeUnit() {
			var unit = $(this).find(":selected").text();
			var minTime = Helper.computeTime(self.min, unit);
			var maxTime = Helper.computeTime(self.max, unit);
			var lowerHandleValue = minTime + ((maxTime - minTime) * 0.2);
			var upperHandleValue = maxTime - ((maxTime - minTime) * 0.2);
			var step = (unit == "sec") ? 1 : 0.1;

			self.updateSliderMinMax(minTime, maxTime);
			self.updateSliderStep(step);
			self.updateSliderValues([ lowerHandleValue, upperHandleValue ]);
			self.updateHandles();
			self.updateMinMaxText();
		}
	},

	//----------- update slider values -----------//

	updateSliderMinMax: function(min, max) {
		var self = this;

		self.slider.slider("setAttribute", "min", min);
		self.slider.slider("setAttribute", "max", max);
	},
	updateSliderValues: function(range) {
		var self = this;

		self.slider.slider("setValue", range);
	},
	updateSliderStep: function(step) {
		var self = this;

		self.slider.slider("setAttribute", "step", step);
	},
	updateHandles: function() {
		var self = this;
		var minHandleLeft = $("#slider-context-menu .range.content #slider .min-slider-handle").position().left;
		var minHandleValue = self.slider.slider("getValue")[0];
		var maxHandleLeft = $("#slider-context-menu .range.content #slider .max-slider-handle").position().left
		var maxHandleValue = self.slider.slider("getValue")[1];

		$("#slider-context-menu .range.content .min-handle-line")
			.css("left", minHandleLeft);
		$("#slider-context-menu .range.content .max-handle-line")
			.css("left", maxHandleLeft);
		$("#slider-context-menu .range.content .min-handle-text")
			.css("left", minHandleLeft)
			.html(minHandleValue);
		$("#slider-context-menu .range.content .max-handle-text")
			.css("left", maxHandleLeft)
			.html(maxHandleValue);
	},
	updateMinMaxText: function() {
		var self = this;
		var minValue = self.slider.slider("getAttribute", "min");
		var maxValue = self.slider.slider("getAttribute", "max");

		$("#slider-context-menu .range.content .min-text")
			.html(minValue);
		$("#slider-context-menu .range.content .max-text")
			.html(maxValue);
	},
	removeHandlesAndMinMaxText: function() {
		$("#slider-context-menu .range.content .min-handle-text").html("");
		$("#slider-context-menu .range.content .max-handle-text").html("");
		$("#slider-context-menu .range.content .min-text").html("");
		$("#slider-context-menu .range.content .max-text").html("");
	}
}