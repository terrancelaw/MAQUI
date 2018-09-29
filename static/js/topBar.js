var TopBar = {
	init: function(panelEl) {
		var self = this;

		self.appendTo(panelEl);
		self.initTooltipBehaviour(panelEl);
		self.initClickAdjustButtonsBehaviour(panelEl);
		self.initChangeXScaleButtonBehaviour(panelEl);
		self.initClickRemoveButtonBehaviour(panelEl);
		self.initClickCollapseExpandButtonBehaviour(panelEl);
		RecordAttributeBar.initScrollBehaviour(panelEl);
	},
	appendTo: function(panelEl) {
		var html = "<div class='top-bar'>" +
						"<span class='context label'>Context: </span>" +
						"<div class='context content'><svg></svg></div>" +
						"<span class='filter label'>Filters: </span>" +
						"<div class='filter bar'>" +
							"<div class='container'></div>" +
							"<span class='fa-plus' tooltip-text='Add Record Attribute Filter'></span>" +
						"</div>" +
						"<span class='fa x-scale-toggle time' tooltip-text='X Axis: Time'></span>" +
						"<span class='fa fa-arrows-h selected' tooltip-text='Adjust Horizontal Scale'></span>" +
						"<span class='fa fa-arrows-v selected' tooltip-text='Adjust Vertical Scale'></span>" +
						"<span class='fa fa-remove' tooltip-text='Remove Panel'></span>" +
						"<span class='fa collapse-expand-toggle collapse' tooltip-text='Collapse Panel'></span>" +
				   "</div>";

		$(panelEl).append(html);
	},
	initTooltipBehaviour: function(panelEl) {
		$(panelEl).find(".top-bar .fa-plus")
			.mouseover(mouseoverButton)
			.mouseout(mouseoutButton);
		$(panelEl).find(".top-bar .x-scale-toggle")
			.mouseover(mouseoverButton)
			.mouseout(mouseoutButton);
		$(panelEl).find(".top-bar .fa-arrows-h")
			.mouseover(mouseoverButton)
			.mouseout(mouseoutButton);
		$(panelEl).find(".top-bar .fa-arrows-v")
			.mouseover(mouseoverButton)
			.mouseout(mouseoutButton);
		$(panelEl).find(".top-bar .fa-remove")
			.mouseover(mouseoverButton)
			.mouseout(mouseoutButton);
		$(panelEl).find(".top-bar .collapse-expand-toggle")
			.mouseover(mouseoverButton)
			.mouseout(mouseoutButton);

		function mouseoverButton() {
			var tooltipText = $(this).attr("tooltip-text");
			var bbox = this.getBoundingClientRect();

			$("#my-tooltip")
				.attr("data-tooltip", tooltipText)
				.css("top", bbox.top + bbox.height + 10)
				.css("left", bbox.left + bbox.width / 2)
				.addClass("show")
				.removeClass("top");
		}

		function mouseoutButton() {
			$("#my-tooltip")
				.removeClass("show");
		}
	},
	initClickAdjustButtonsBehaviour: function(panelEl) {
		var self = this;

		$(panelEl).find(".top-bar .fa-arrows-h")
			.click(clickAdjustHorizontalButton);
		$(panelEl).find(".top-bar .fa-arrows-v")
			.click(clickAdjustVerticalButton);

		function clickAdjustHorizontalButton() {
			var isSelected = $(this).hasClass("selected");
			var panelEl = $(this).closest(".panel")[0];

			if (isSelected)
				$(this).removeClass("selected");
			if (!isSelected)
				$(this).addClass("selected");

			FunnelVis.update(panelEl, true); // not adding or removing ForS
			Timeline.update(panelEl);
		}

		function clickAdjustVerticalButton() {
			var isSelected = $(this).hasClass("selected");
			var panelEl = $(this).closest(".panel")[0];

			if (isSelected)
				$(this).removeClass("selected");
			if (!isSelected)
				$(this).addClass("selected");

			FunnelVis.update(panelEl, true); // not adding or removing ForS
			Timeline.update(panelEl);
		}
	},
	initChangeXScaleButtonBehaviour: function(panelEl) {
		$(panelEl).find(".top-bar .x-scale-toggle")
			.click(clickChangeXScaleButtonBehaviour);

		function clickChangeXScaleButtonBehaviour() {
			var isXScaleTime = $(this).hasClass("time");
			var panelID = $(this).closest(".panel").attr("panel-id");

			if (isXScaleTime) {
				$(this)
					.attr("tooltip-text", "X Scale: Number of Events")
					.removeClass("time")
					.addClass("number-of-events");
					
				$("#my-tooltip")
					.attr("data-tooltip", "X Scale: Number of Events");

				Timeline.updateTextHighlight(panelID);
				Timeline.update(panelEl);
				FunnelVis.update(panelEl, true); // not adding or removing ForS
			}

			if (!isXScaleTime) {
				$(this)
					.attr("tooltip-text", "X Scale: Time")
					.removeClass("number-of-events")
					.addClass("time");
				
				$("#my-tooltip")
					.attr("data-tooltip", "X Scale: Time");

				Timeline.updateTextHighlight(panelID);
				Timeline.update(panelEl);
				FunnelVis.update(panelEl, true); // not adding or removing ForS
			}
		}
	},
	initClickRemoveButtonBehaviour: function(panelEl) {
		$(panelEl).find(".top-bar .fa-remove")
			.click(clickRemoveButton);

		function clickRemoveButton() {
			var panelID = $(this).closest(".panel").attr("panel-id");

			$("#my-tooltip").removeClass("show");
			WebAPI.removePanel(panelID, afterRemovingPanel);
		}

		function afterRemovingPanel(response) {
			var deletedPanelID = response.deletedPanelID;
			var minifiedFandS = response.minifiedFandS;

			FandSManager.update(minifiedFandS);
			SubsequenceView.removePanel(deletedPanelID);
			Timeline.removeFromDataStructures(deletedPanelID);
			FunnelVis.removeFromDataStructures(deletedPanelID);
			ContextBar.removeFromDataStructures(deletedPanelID);
			ColourManager.refreshColourMarkers();

			if (deletedPanelID == InspectionView.currentPanelID)
				InspectionView.clear();
		}
	},
	initClickCollapseExpandButtonBehaviour: function(panelEl) {
		$(panelEl).find(".top-bar .collapse-expand-toggle")
			.click(clickCollapseExpandButtonBehaviour);

		function clickCollapseExpandButtonBehaviour() {
			var clickToCollapse = $(this).hasClass("collapse");
			var panelEl = $(this).closest(".panel")[0];

			if (clickToCollapse) { // collapse
				$(panelEl).find(".funnel").css("display", "none");
				$(panelEl).find(".timeline").css("display", "none");
				$(panelEl).css("height", "43px");

				$(this)
					.attr("tooltip-text", "Expand Panel")
					.removeClass("collapse")
					.addClass("expand");
				$("#my-tooltip")
					.attr("data-tooltip", "Expand Panel");
			}

			if (!clickToCollapse) { // expand
				$(panelEl).find(".funnel").css("display", "block");
				$(panelEl).find(".timeline").css("display", "block");
				$(panelEl).css("height", "");

				$(this)
					.attr("tooltip-text", "Collapse Panel")
					.removeClass("expand")
					.addClass("collapse");
				$("#my-tooltip")
					.attr("data-tooltip", "Collapse Panel");
			}
		}
	},
	initClickPlusSignBehaviour: function() {
		var plusSignSelector = ".top-bar .fa-plus";
		var contextMenuAndEditorSelector = ".context-menu, #slider-range-editor"; // ban this not behaviour

		Body.registerClickEvent(plusSignSelector, contextMenuAndEditorSelector, clickPlusSign);

		function clickPlusSign(event) {
			var plusSignEl = $(event.target).closest(".fa-plus")[0];
			var panelID = $(event.target).closest(".panel").attr("panel-id");
			var ForSID = FandSManager.getLastFilterID(panelID);
			var outputType = "after";
			var bbox = plusSignEl.getBoundingClientRect();

			ContextMenu.recordTargetSubsequence(panelID, ForSID, outputType, "filter");
			ContextMenu.show("record", bbox.y + 10, bbox.x + 10);
		}
	},
	isHScaleButtonSelected: function(panelEl) {
		return $(panelEl).find(".top-bar .fa-arrows-h").hasClass("selected");
	},
	isVScaleButtonSelected: function(panelEl) {
		return $(panelEl).find(".top-bar .fa-arrows-v").hasClass("selected");
	},
}