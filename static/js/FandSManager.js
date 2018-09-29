var FandSManager = {
	previousMinifiedFandS: {},
	minifiedFandS: {},

	update: function(minifiedFandS) {
		var self = this;

		self.previousMinifiedFandS = self.minifiedFandS;
		self.minifiedFandS = minifiedFandS;
	},
	getNextForSID: function(panelID, currentForSID, minifiedFandS = null) {
		var self = this;
		
		if (minifiedFandS == null)
			minifiedFandS = self.minifiedFandS;

		for (var anotherForSID in minifiedFandS[panelID]) {
			if (anotherForSID != currentForSID) {
				var inputForSIDForAnotherForS = minifiedFandS[panelID][anotherForSID]["input"].split("-")[0];

				if (inputForSIDForAnotherForS == currentForSID)
					return anotherForSID;
			}
		}

		return null; // the last
	},
	getPreviousForSID: function(panelID, currentForSID) {
		var self = this;
		var inputForSID = self.minifiedFandS[panelID][currentForSID]["input"].split("-")[0];

		return inputForSID;
	},
	getLastForSID: function(panelID) {
		var self = this;
		var currentForSID = "0"; // 0 is always the starting point

		while (currentForSID != null) {
			var nextForSID = self.getNextForSID(panelID, currentForSID);

			if (nextForSID == null)
				return currentForSID;

			currentForSID = nextForSID;
		}
	},
	getLastFilterID: function(panelID) {
		var self = this;
		var currentForSID = "0"; // 0 is always the starting point
		var lastFilterID = "0";

		while (currentForSID != null) {
			var isFilter = self.minifiedFandS[panelID][currentForSID].applyToRecordAttributes;

			if (isFilter)
				lastFilterID = currentForSID;

			currentForSID = self.getNextForSID(panelID, currentForSID);
		}

		return lastFilterID;
	},
	hasForSBeenInsertedBefore: function(panelID, previouTargetForSID, newTargetForSID) {
		var self = this;
		var previousNumberOfForSBeforeTarget = 0;
		var currentNumberOfForSBeforeTarget = 0;
		var currentForSIDForPreviousFandS = "0"; // 0 is always the starting point
		var currentForSIDForCurrentFandS = "0"; // 0 is always the starting point

		while (currentForSIDForPreviousFandS != previouTargetForSID && currentForSIDForPreviousFandS != null) {
			previousNumberOfForSBeforeTarget++;
			currentForSIDForPreviousFandS = self.getNextForSID(panelID, currentForSIDForPreviousFandS, self.previousMinifiedFandS);
		}

		while (currentForSIDForCurrentFandS != newTargetForSID && currentForSIDForCurrentFandS != null) {
			currentNumberOfForSBeforeTarget++;
			currentForSIDForCurrentFandS = self.getNextForSID(panelID, currentForSIDForCurrentFandS);
		}

		if (currentForSIDForPreviousFandS == null || currentForSIDForCurrentFandS == null) // not found in at least one of them
			return false;
		if (previousNumberOfForSBeforeTarget == currentNumberOfForSBeforeTarget)
			return false;
		if (previousNumberOfForSBeforeTarget != currentNumberOfForSBeforeTarget)
			return true;
	},
	isFilter: function(panelID, ForSID) {
		var self = this;

		if (!(ForSID in self.minifiedFandS[panelID]))
			return false;

		return self.minifiedFandS[panelID][ForSID].applyToRecordAttributes;
	}
}