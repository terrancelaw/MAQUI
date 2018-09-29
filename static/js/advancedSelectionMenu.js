var AdvancedSelectionMenu = {
	init: function() {
		var self = this;

		self.initClickOperatorBehaviour();
		self.initDropDownMenuBehaviour();
		self.initSearchBoxBehaviour();
		self.initNotClickMenuBehaviour();
		self.populateAttributeAndValueList();
	},
	initClickOperatorBehaviour: function() {
		var self = this;

		$("#advanced-selection-menu .operator.content .symbol").click(clickOperator);

		function clickOperator() {
			var operatorName = $(this).text();

			PatternEditor.Helper.removeAllDummyBoxes();
			self.hide();
			PatternEditor.addToMatchers(operatorName, "operator");
			PatternEditor.redraw();
		}
	},
	initClickValueBehaviour: function() {
		var self = this;

		$("#advanced-selection-menu .values.content .container .dummy-div div").click(clickValue);

		function clickValue() {
			var attributeName = $("#advanced-selection-menu .attribute.content select option:selected").text();
			var attributeValue = d3.select(this).datum();
			var displayString = attributeValue.substring(0, 2).toUpperCase();
			var data = { attributeName: attributeName, attributeValue: attributeValue };

			PatternEditor.Helper.removeAllDummyBoxes();
			self.hide();
			PatternEditor.addToMatchers(displayString, "AVPair", data);
			PatternEditor.redraw();
		}
	},
	initDropDownMenuBehaviour: function() {
		var self = this;

		$("#advanced-selection-menu .attribute.content select").change(changeDropDownMenu);

		function changeDropDownMenu() {
			var attributeName = $(this).find(":selected").text();

			self.removeValueList();
			self.retrieveAndDisplayValueList(attributeName, "event");
		}
	},
	initSearchBoxBehaviour: function() {
		var self = this;

		$("#advanced-selection-menu .values.search-box input").on("input", inputSearchBox);

		function inputSearchBox() {
			var valueSelector = "#advanced-selection-menu .values.content .container .dummy-div div";
			var keyword = $(this).val().toLowerCase();

			d3.selectAll(valueSelector)
				.each(function(d) {
					var value = d.toLowerCase();
					var valueContainsKeyword = value.indexOf(keyword) != -1;

					if (valueContainsKeyword)
						$(this).css("display", "");
					if (!valueContainsKeyword)
						$(this).css("display", "none");
				});

			$(valueSelector).css("margin-top", "");
			$(valueSelector).css("margin-bottom", "");
			$(valueSelector + ":visible:first").css("margin-top", "5px");
			$(valueSelector + ":visible:last").css("margin-bottom", "5px");
		}
	},
	initNotClickMenuBehaviour: function() {
		var self = this;
		var advancedSelectionMenuSelector = "#advanced-selection-menu";
		var contextMenuAndEditorSelector = ".context-menu, #slider-range-editor"; // ban this not behaviour

		Body.registerNotClickEvent(advancedSelectionMenuSelector, notClickMenu);
		Body.registerClickEvent(advancedSelectionMenuSelector, contextMenuAndEditorSelector, dummyFunction);

		function notClickMenu() {
			PatternEditor.Helper.removeAllDummyBoxes();
			self.hide();
		}

		function dummyFunction() {}
	},
	populateAttributeAndValueList: function() {
		var self = this;

		WebAPI.getAttributeList("event", afterGettingAttrList);

		function afterGettingAttrList(attributeList) {
			if (attributeList.length == 0)
				return;

			var attributeName = attributeList[0].attributeName;
			var attributeType = attributeList[0].attributeType;

			self.displayAttributeList(attributeList);
			self.retrieveAndDisplayValueList(attributeName, attributeType);
		}
	},
	displayAttributeList: function(attributeList) {
		for (var i = 0; i < attributeList.length; i++) {
			var attributeName = attributeList[i].attributeName;
			var attributeType = attributeList[i].attributeType;
			var numericalOrCategorical = attributeList[i].numericalOrCategorical;
			var optionHTML = "<option value='" + attributeName + "' name='" + attributeName + "' attributeType='" + attributeType + "' numericalOrCategorical='" + numericalOrCategorical + "'>" + 
								attributeName +
							 "</option>";

			$("#advanced-selection-menu .attribute.content select").append(optionHTML);
		}
	},
	retrieveAndDisplayValueList: function(attributeName, attributeType) {
		var self = this;

		WebAPI.getValueList(0, 0, 0, attributeName, attributeType, afterGettingValueList);

		function afterGettingValueList(valueList) {
			self.displayValueList(valueList);
			self.initClickValueBehaviour();
		}
	},
	removeValueList: function() {
		$("#advanced-selection-menu .values.content .container .dummy-div div").remove();
	},
	displayValueList: function(valueList) {
		valueList.sort(function(x, y){
		   return d3.ascending(x.value, y.value);
		});

		for (var i = 0; i < valueList.length; i++) {
			var value = valueList[i].value;
			var itemHTML = "<div><span>" + value + "</span></div>";

			$("#advanced-selection-menu .values.content .container .dummy-div").append(itemHTML);
			d3.select("#advanced-selection-menu .values.content .container .dummy-div div:last-child").datum(value); // bind data
		}
	},
	show: function(top, left) {
		var windowHeight = $(window).height();
		var adjustedTop = (top + advancedSelectionMenuHeight > windowHeight) ? (top - advancedSelectionMenuHeight) : top;

		$("#advanced-selection-menu")
			.css("display", "block")
			.css("top", adjustedTop)
			.css("left", left);

		// stop point events on query box
		PatternEditor.svg.style("pointer-events", "none");
	},
	hide: function() {
		$("#advanced-selection-menu")
			.css("display", "");

		// restore point events on query box
		PatternEditor.svg.style("pointer-events", "");
	},
	isOpened: function() {
		return $("#advanced-selection-menu").css("display") == "block";
	}
}