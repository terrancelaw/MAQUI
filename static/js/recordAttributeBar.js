var RecordAttributeBar = {
	initScrollBehaviour: function(panelEl) {
		$(panelEl).find(".top-bar .filter.bar .container").mousewheel(scrollFilterBar);

		function scrollFilterBar(event, delta) {
			this.scrollLeft -= (delta * 30);
      		event.preventDefault();
		}
	},
	update: function(panelEl) {
		var self = this;

		self.updateTags(panelEl);
		self.updateFilterLabel(panelEl);
	},
	updateTags: function(panelEl) {
		var self = this;
		var filterNameList = [];
		var panelID = $(panelEl).attr("panel-id");
		var currentForSID = FandSManager.getNextForSID(panelID, "0"); // skip 0
		var isCurrentFilter = FandSManager.isFilter(panelID, currentForSID);
		var dragBehaviour = d3.drag()
        	.on("start", startDragTag)
        	.on("drag", dragTag)
        	.on("end", endDragTag);

		// clear all span
		$(panelEl).find(".top-bar .filter.bar .container .tag").remove();

		// append names in order
		while (currentForSID != null && isCurrentFilter) {
			var currentName = ("displayString" in FandSManager.minifiedFandS[panelID][currentForSID])
							? FandSManager.minifiedFandS[panelID][currentForSID].displayString
							: FandSManager.minifiedFandS[panelID][currentForSID].name;
			var currentNameHTML = "<span class='tag' ForS-ID='" + currentForSID + "'>" + currentName + "</span>"

			$(panelEl).find(".top-bar .filter.bar .container")
				.append(currentNameHTML);

			var currentForSID = FandSManager.getNextForSID(panelID, currentForSID);
			var isCurrentFilter = FandSManager.isFilter(panelID, currentForSID);
		}

		// dragging tag
		d3.select(panelEl).selectAll(".top-bar .filter.bar .container .tag")
			.call(dragBehaviour);

		function startDragTag() {
			var panelID = $(this).closest(".panel").attr("panel-id");
			var ForSID = $(this).attr("ForS-ID");
			var mouseX = d3.event.sourceEvent.pageX;
			var mouseY = d3.event.sourceEvent.pageY;
			var text = $(this).html();

			DraggableRecordAttrTag.hasDragged = false;
			DraggableRecordAttrTag.show(mouseY, mouseX, text);
			DraggableRecordAttrTag.storeInfoBeforeRemove(panelID, ForSID);
			$(this).remove();
		}

		function dragTag() {
			var mouseX = d3.event.sourceEvent.pageX;
			var mouseY = d3.event.sourceEvent.pageY;

			DraggableRecordAttrTag.hasDragged = true;
			DraggableRecordAttrTag.move(mouseY, mouseX);
		}

		function endDragTag() {
			var panelID = DraggableRecordAttrTag.deletingPanelID;
			var ForSID = DraggableRecordAttrTag.deletingForSID;
			var panelEl = $("#subsequence-view .panel[panel-id=" + panelID + "]")[0];

			if (DraggableRecordAttrTag.hasDragged) {
				DraggableRecordAttrTag.hide();
				WebAPI.removeSorF(panelID, ForSID, afterRemovingSorF);
			}
			if (!DraggableRecordAttrTag.hasDragged) {
				DraggableRecordAttrTag.hide();
				self.update(panelEl);
			}
		}

		function afterRemovingSorF(response) {
			var updatedPanelID = response.updatedPanelID;
			var removedForSID = response.removedForSID;
			var minifiedFandS = response.minifiedFandS;
			var updatedPanelEl = $("#subsequence-view .panel[panel-id=" + updatedPanelID + "]")[0];
			var deletedAVPair = FandSManager.minifiedFandS[updatedPanelID][removedForSID].name; // do before update minifiedFandS

			FandSManager.update(minifiedFandS);
			FunnelVis.update(updatedPanelEl);
			Timeline.update(updatedPanelEl);
			RecordAttributeBar.update(updatedPanelEl);
		}
	},
	updateFilterLabel: function(panelEl) {
		var panelID = $(panelEl).attr("panel-id");
		var lasterFilterIDInCurrentPanel = FandSManager.getLastFilterID(panelID);
		var numberOfSequencesBeforeFiltering = FandSManager.minifiedFandS[panelID]["0"]["numberOfSequences"]["after"];
		var numberOfSequencesAfterFiltering = FandSManager.minifiedFandS[panelID][lasterFilterIDInCurrentPanel]["numberOfSequences"]["after"];
		var filterString = "Filters (" + numberOfSequencesAfterFiltering + "/" + numberOfSequencesBeforeFiltering + ") : ";

		$(panelEl).find(".top-bar .filter.label")
			.html(filterString);
	}
}