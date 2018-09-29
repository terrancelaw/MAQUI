var SubsequenceView = {
	startAndEndNames: {}, // { panelID: { start, end } }

	init: function() {
		var self = this;
		var newPanelEl = self.appendPanel();

		TopBar.init(newPanelEl);
		TopBar.initClickPlusSignBehaviour(); // only need to do once
		FunnelVis.init(newPanelEl);
		Timeline.init(newPanelEl);
		Timeline.initClickPlusSignBehaviour(); // only need to do once
		self.initClickAddPanelButtonBehaviour();
		self.initClickToggleNameButtonBehaviour();
		self.createNewPanelOnServer(0, 0, 0, true, newPanelEl, null, null);
	},
	initClickAddPanelButtonBehaviour: function() {
		var self = this;

		$("#subsequence-view .add-panel-btn").click(clickAddPanelButton);

		function clickAddPanelButton() {
			var newPanelEl = self.appendPanel();

			TopBar.init(newPanelEl);
			FunnelVis.init(newPanelEl);
			Timeline.init(newPanelEl);
			self.scrollToBottom();
			self.createNewPanelOnServer(0, 0, 0, false, newPanelEl, null, null);
		}
	},
	initClickToggleNameButtonBehaviour: function() {
		$("#subsequence-view .toggle-name-btn").click(clickToggleNameButton);

		function clickToggleNameButton() {
			var currentState = $(this).attr("state");

			// change the state of the button
			if (currentState == "short")
				$(this)
					.attr("state", "long")
					.html("<span class='fa-exchange'></span>Change to Short Names");

			if (currentState == "long")
				$(this)
					.attr("state", "short")
					.html("<span class='fa-exchange'></span>Change to Long Names");

			// update views
			FrequentPatternView.refresh();
			RawSequenceView.refresh();
			InspectionViewContext.refresh();
			Timeline.refreshAll();
			ContextBar.refreshAll();
		}
	},
	removePanel: function(panelID) {
		var panelEl = $("#subsequence-view .panel[panel-id=" + panelID + "]");

		panelEl.remove();
	},
	appendPanel: function() {
		var html = "<div class='panel'></div>";

		$("#subsequence-view > .container").append(html);

		return $("#subsequence-view .panel:last-child")[0];
	},
	createNewPanelOnServer: function(panelID, ForSID, outputType, clearPrevious, newPanelEl, clickedLinkLeftSID, clickedLinkRightSID, secondCallback = null) {
		var self = this;
		var clickedPanelID = (panelID == 0 && ForSID == 0 && outputType == 0) ? null : panelID;
		var notSID = (outputType == "not") ? ForSID : null;

		WebAPI.initFandSForNewPanel(panelID, ForSID, outputType, clearPrevious, callback);

		function callback(response) {
			var newPanelID = response.newPanelID;
			var minifiedFandS = response.minifiedFandS;
			var timeAndEventCountFilterList = response.timeAndEventCountFilterList;

			$(newPanelEl).attr("panel-id", newPanelID);
			self.storeStartAndEndNames(panelID, clickedLinkLeftSID, clickedLinkRightSID, newPanelID);
			FandSManager.update(minifiedFandS);
			ContextBar.update(clickedPanelID, newPanelID, clickedLinkLeftSID, notSID, timeAndEventCountFilterList);
			RecordAttributeBar.update(newPanelEl);
			FunnelVis.createBackground(newPanelEl); // to make animation less distracting
			FunnelVis.update(newPanelEl);
			Timeline.addEmptyTimeline(newPanelEl);
			Timeline.update(newPanelEl);
			Timeline.initMousemoveBehaviour(newPanelEl);
			Timeline.initMouseleaveBehaviour(newPanelEl);

			if (secondCallback != null)
				secondCallback(response);
		}
	},
	storeStartAndEndNames: function(clickedLinkPanelID, clickedLinkLeftSID, clickedLinkRightSID, newPanelID) {
		var self = this;
		var isFirstPanel = (clickedLinkLeftSID == null && clickedLinkRightSID == null);

		if (isFirstPanel) {
			self.startAndEndNames[newPanelID] = {};
			self.startAndEndNames[newPanelID].start = "Start";
			self.startAndEndNames[newPanelID].end = "End";
		}

		if (!isFirstPanel) {
			var leftSPointName = FunnelVis.splittingPointsByID[clickedLinkPanelID][clickedLinkLeftSID].data.fullName;
			var rightSPointName = FunnelVis.splittingPointsByID[clickedLinkPanelID][clickedLinkRightSID].data.fullName;

			self.startAndEndNames[newPanelID] = {};
			self.startAndEndNames[newPanelID].start = leftSPointName;
			self.startAndEndNames[newPanelID].end = rightSPointName;
		}
	},
	scrollToBottom: function() {
		var containerHeight = $("#subsequence-view > .container").height();
		var containerContentHeight = $("#subsequence-view > .container")[0].scrollHeight;

		$("#subsequence-view > .container")
			.animate({
				scrollTop: containerContentHeight - containerHeight
			}, 200);
	}
}