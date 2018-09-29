var ContextMenu = {
	targetPanelID: null,
	targetForSID: null,
	targetOutputType: null,
	filterOrSplit: null,

	currentAttributeHeader: null,
	currentAttributeList: [],

	init: function() {
		var contextMenuAndEditorSelector = ".context-menu, #slider-range-editor";

		Body.registerNotClickEvent(contextMenuAndEditorSelector, notClickContextMenu);

		function notClickContextMenu(event) {
			var clickToDeleteMatcherItem = $(event.target).closest(".delete").length != 0;

			if (!AdvancedSelectionMenu.isOpened() && !clickToDeleteMatcherItem) {
				SimpleContextMenu.hide();
				SliderContextMenu.hide();
				AdvancedContextMenu.hide();

				d3.selectAll(".plus-sign-layer .plus-sign")
					.style("display", "none"); // hide the clicked plus sign
			}

			if (clickToDeleteMatcherItem) {
				$("#my-tooltip")
					.removeClass("show");
			}
		}
	},
	recordTargetSubsequence: function(panelID, ForSID, outputType, filterOrSplit) {
		var self = this;

		self.targetPanelID = panelID;
		self.targetForSID = ForSID;
		self.targetOutputType = outputType;
		self.filterOrSplit = filterOrSplit;
	},
	empty: function() {
		SimpleContextMenu.empty();
		SliderContextMenu.empty();
		AdvancedContextMenu.empty();
	},
	show: function(attributeType, top, left) {
		var self = this;

		WebAPI.getAttributeList(attributeType, afterGettingAttrList);
		$("#my-tooltip").removeClass("show"); // remove the tooltip on plus sign

		function afterGettingAttrList(attributeList) {
			if (attributeList.length == 0)
				return;

			var panelID = ContextMenu.targetPanelID;
			var ForSID = ContextMenu.targetForSID;
			var outputType = ContextMenu.targetOutputType;
			var attributeName = attributeList[0].attributeName;
			var attributeType = attributeList[0].attributeType;
			var isFirstAttrNumOrCate = attributeList[0].numericalOrCategorical;
			var attributeHeader = attributeType == "event" ? "Event Attribute" : "Record Attribute";
			var showSwitchModeButton = (attributeHeader == "Event Attribute") ? true: false;
			var contextMenuHeight = simpleContextMenuHeight;
			var windowHeight = $(window).height();
			var adjustedTop = (top + contextMenuHeight > windowHeight) ? (top - contextMenuHeight - 5) : top;

			self.currentAttributeList = attributeList;
			self.currentAttributeHeader = attributeHeader;

			if (isFirstAttrNumOrCate == "numerical") {
				SliderContextMenu.empty();
				SliderContextMenu.show(adjustedTop, left);
				SliderContextMenu.displayAttributeList(attributeList);
				SliderContextMenu.updateTimeUnitWidget();
				SliderContextMenu.retrieveAndUpdateMinMax(panelID, ForSID, outputType, attributeName);
			}

			if (isFirstAttrNumOrCate == "categorical") {
				SimpleContextMenu.empty();
				SimpleContextMenu.show(adjustedTop, left);
				SimpleContextMenu.updateSwitchModeButton(showSwitchModeButton);
				SimpleContextMenu.changeAttrHeader(attributeHeader);
				SimpleContextMenu.displayAttributeList(attributeList);
				SimpleContextMenu.retrieveAndDisplayValueList(panelID, ForSID, outputType, attributeName, attributeType);
			}
		}
	},
	changeAttributeMenu: function(selectedAttrName) {
		var self = this;
		var isSelectedAttrNumOrCate = null;
		var selectedAttrType = null;
		var top = $(".context-menu:visible").css("top"); // only one is visible
		var left = $(".context-menu:visible").css("left");
		var panelID = self.targetPanelID;
		var ForSID = self.targetForSID;
		var outputType = self.targetOutputType;
		var attributeHeader = self.currentAttributeHeader;
		var attributeList = self.currentAttributeList;
		var showSwitchModeButton = (attributeHeader == "Event Attribute") ? true: false;

		for (var i = 0; i < self.currentAttributeList.length; i++) {
			var currentAttrName = self.currentAttributeList[i].attributeName;
			if (currentAttrName == selectedAttrName) {
				isSelectedAttrNumOrCate = self.currentAttributeList[i].numericalOrCategorical;
				selectedAttrType = self.currentAttributeList[i].attributeType;
			}
		}

		if (isSelectedAttrNumOrCate == "numerical") {
			ContextMenu.empty();
			SimpleContextMenu.hide();
			SliderContextMenu.show(top, left);
			SliderContextMenu.displayAttributeList(attributeList, selectedAttrName);
			SliderContextMenu.updateTimeUnitWidget();
			SliderContextMenu.retrieveAndUpdateMinMax(panelID, ForSID, outputType, selectedAttrName);
		}

		if (isSelectedAttrNumOrCate == "categorical") {
			ContextMenu.empty();
			SliderContextMenu.hide();
			SimpleContextMenu.show(top, left);
			SimpleContextMenu.updateSwitchModeButton(showSwitchModeButton);
			SimpleContextMenu.changeAttrHeader(attributeHeader);
			SimpleContextMenu.displayAttributeList(attributeList, selectedAttrName);
			SimpleContextMenu.retrieveAndDisplayValueList(panelID, ForSID, outputType, selectedAttrName, selectedAttrType);
		}
	},
	isOpened() {
		var isSimpleContextMenuOpened = $("#simple-context-menu").css("display") == "block";
		var isSliderContextMenuOpened = $("#slider-context-menu").css("display") == "block";
		var isAdvancedContextMenuOpened = $("#advanced-context-menu").css("display") == "block";

		if (isSimpleContextMenuOpened || isSliderContextMenuOpened || isAdvancedContextMenuOpened)
			return true;

		return false;
	}
}