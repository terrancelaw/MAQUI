var SimpleContextMenu = {
	init: function() {
		var self = this;

		self.initCancelButton();
		self.initConfirmButton();
		self.initSwitchModeButton();
		self.initDropDownMenuBehaviour();
		self.initSearchBoxBehaviour();
	},
	initCancelButton: function() {
		var self = this;

		$("#simple-context-menu .footer .cancel-btn").click(clickCancelButton);

		function clickCancelButton() {
			self.hide();
		}
	},
	initConfirmButton: function() {
		var self = this;

		$("#simple-context-menu .footer .confirm-btn").click(clickConfirmButton);

		function clickConfirmButton() {
			if (!$(this).hasClass("disabled")) {
				var selectedAttrName = $("#simple-context-menu .attribute.content option:selected").val();
				var selectedAttrValue = d3.select("#simple-context-menu .values.content .container .dummy-div div.selected").datum();
				var panelID = ContextMenu.targetPanelID;
				var ForSID = ContextMenu.targetForSID;

				if (ContextMenu.filterOrSplit == "split")
					WebAPI.createSimpleSplittingPoint(panelID, ForSID, selectedAttrName, selectedAttrValue, afterCreatingSimpleSPoint);
				if (ContextMenu.filterOrSplit == "filter")
					WebAPI.createSimpleCategoricalFilter(panelID, ForSID, selectedAttrName, selectedAttrValue, afterCreatingSimpleFilter);
				
				self.hide();
			}
		}

		function afterCreatingSimpleSPoint(response) {
			var updatedPanelID = response.updatedPanelID;
			var minifiedFandS = response.minifiedFandS;
			var updatedPanelEl = $("#subsequence-view .panel[panel-id=" + updatedPanelID + "]")[0];

			FandSManager.update(minifiedFandS);
			FunnelVis.update(updatedPanelEl);
			Timeline.update(updatedPanelEl);
			ColourManager.refreshColourMarkers();
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
	initSwitchModeButton: function() {
		var self = this;

		$("#simple-context-menu .switch-mode-btn").click(clickSwitchModeButton);

		function clickSwitchModeButton() {
			var top = $("#simple-context-menu").css("top");
			var left = $("#simple-context-menu").css("left");

			self.hide();
			AdvancedContextMenu.show(top,left);
		}
	},
	initDropDownMenuBehaviour: function() {
		$("#simple-context-menu .attribute.content select").change(changeDropDownMenu);

		function changeDropDownMenu() {
			var value = $(this).find(":selected").text();

			ContextMenu.changeAttributeMenu(value);
		}
	},
	initSearchBoxBehaviour: function() {
		var self = this;

		$("#simple-context-menu .values.search-box input").on("input", inputSearchBox);

		function inputSearchBox() {
			var valueSelector = "#simple-context-menu .values.content .container .dummy-div div";
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
	hide: function() {
		$("#simple-context-menu")
			.css("display", "none");
	},
	show: function(top, left) {
		$("#simple-context-menu")
			.css("display", "block")
			.css("top", top)
			.css("left", left);
	},
	updateSwitchModeButton: function(showSwitchModeButton) {
		if (showSwitchModeButton)
			$("#simple-context-menu .switch-mode-btn").css("display", "block");
		if (!showSwitchModeButton)
			$("#simple-context-menu .switch-mode-btn").css("display", "none");
	},
	changeAttrHeader: function(header) {
		$("#simple-context-menu .attribute.header span").html(header);
	},
	empty: function() {
		var self = this;

		$("#simple-context-menu .attribute.content select").empty();
		$("#simple-context-menu .values.search-box input").val("");
		$("#simple-context-menu .values.content .container .dummy-div").empty();
		self.updateConfirmButton();
	},
	displayAttributeList: function(attributeList, selectedAttrName = null) {
		for (var i = 0; i < attributeList.length; i++) {
			var attributeName = attributeList[i].attributeName;
			var attributeType = attributeList[i].attributeType;
			var numericalOrCategorical = attributeList[i].numericalOrCategorical;
			var optionHTML = "<option value='" + attributeName + "' name='" + attributeName + "' attributeType='" + attributeType + "' numericalOrCategorical='" + numericalOrCategorical + "'>" + 
								attributeName +
							 "</option>";

			$("#simple-context-menu .attribute.content select").append(optionHTML);
		}

		if (selectedAttrName)
			$("#simple-context-menu .attribute.content select").val(selectedAttrName);
	},
	retrieveAndDisplayValueList: function(panelID, ForSID, outputType, attributeName, attributeType) {
		var self = this;

		WebAPI.getValueList(panelID, ForSID, outputType, attributeName, attributeType, afterGettingValueList);

		function afterGettingValueList(valueList) {
			self.displayValueList(valueList);
			self.initClickValueBehaviour();
		}
	},
	displayValueList: function(valueList) {
		for (var i = 0; i < valueList.length; i++) {
			var value = valueList[i].value;
			var count = valueList[i].count;
			var sequenceText = (count == 1) ? "sequence" : "sequences";
			var itemHTML = "<div><span>" + value + " (" + count + " " + sequenceText + ")" + "</span></div>";

			$("#simple-context-menu .values.content .container .dummy-div").append(itemHTML);
			d3.select("#simple-context-menu .values.content .container .dummy-div div:last-child").datum(value); // bind data
		}
	},
	initClickValueBehaviour: function() {
		var self = this;
		var valueObjects = d3.selectAll("#simple-context-menu .values.content .container .dummy-div div");

		valueObjects.on("click", clickValue);

		function clickValue() {
			var isClickedValueSelected = d3.select(this).classed("selected");

			if (isClickedValueSelected) {
				d3.select(this).classed("selected", false);
			}
			if (!isClickedValueSelected) {
				valueObjects.classed("selected", false);
				d3.select(this).classed("selected", true);
			}

			self.updateConfirmButton();
		}
	},
	updateConfirmButton: function() {
		var isSomeValueSelected = $("#simple-context-menu .values.content .container .dummy-div div.selected").length != 0;

		if (isSomeValueSelected)
			$("#simple-context-menu .footer .confirm-btn").removeClass("disabled");
		if (!isSomeValueSelected)
			$("#simple-context-menu .footer .confirm-btn").addClass("disabled");
	}
}