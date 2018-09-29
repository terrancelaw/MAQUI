var WebAPI = {
	initFandSForNewPanel: function(panelID, ForSID, outputType, clearPrevious, callback) {
		var query = {
			panelID: panelID,
			ForSID: ForSID,
			outputType: outputType,
			clearPrevious: clearPrevious
		};

		$.getJSON("/initFandSForNewPanel/", query, function(response) {
			callback(response);
		});
	},
	removePanel: function(panelID, callback) {
		$.getJSON("/removePanel/" + panelID + "/", function(response) {
			callback(response);
		});
	},
	getAttributeList: function(attributeType, callback) {
		$.getJSON("/getAttributeList/" + attributeType + "/", function(response) {
			callback(response);
		});
	},
	getValueList: function(panelID, ForSID, outputType, attributeName, attributeType, callback) {
		var query = {
			panelID: panelID,
			ForSID: ForSID,
			outputType: outputType,
			attributeName: attributeName,
			attributeType: attributeType
		};

		$.getJSON("/getValueList/", query, function(response) {
			callback(response);
		});
	},
	getDiscretizedNumericalAttrCount: function(panelID, ForSID, outputType, attributeName, callback) {
		var query = {
			panelID: panelID,
			ForSID: ForSID,
			outputType: outputType,
			attributeName: attributeName
		};

		$.getJSON("/getDiscretizedNumericalAttrCount/", query, function(response) {
			callback(response);
		});
	},
	getMinMax: function(panelID, ForSID, outputType, attributeName, callback) {
		var query = {
			panelID: panelID,
			ForSID: ForSID,
			outputType: outputType,
			attributeName: attributeName
		};

		$.getJSON("/getMinMax/", query, function(response) {
			callback(response);
		});
	},
	createSimpleSplittingPoint: function(panelID, ForSID, attributeName, attributeValue, callback) {
		var query = {
			panelID: panelID,
			ForSID: ForSID,
			attributeName: attributeName,
			attributeValue: attributeValue
		};

		$.getJSON("/createSimpleSplittingPoint/", query, function(response) {
			callback(response);
		});
	},
	createSimpleCategoricalFilter: function(panelID, ForSID, attributeName, attributeValue, callback) {
		var query = {
			panelID: panelID,
			ForSID: ForSID,
			attributeName: attributeName,
			attributeValue: attributeValue
		};

		$.getJSON("/createSimpleCategoricalFilter/", query, function(response) {
			callback(response);
		});
	},
	createSimpleNumericalFilter: function(panelID, ForSID, attributeName, minValue, maxValue, displayString, callback) {
		var query = {
			panelID: panelID,
			ForSID: ForSID,
			attributeName: attributeName,
			minValue: minValue,
			maxValue: maxValue,
			displayString: displayString
		};

		$.getJSON("/createSimpleNumericalFilter/", query, function(response) {
			callback(response);
		});
	},
	createPatternSplittingPoint: function(panelID, ForSID, name, eventMatchers, orderedAVPairsForEachMatcher, logicTableForEachMatcher, callback) {
		var query = {
			panelID: panelID,
			ForSID: ForSID,
			name: name,
			eventMatchers: eventMatchers,
			orderedAVPairsForEachMatcher: orderedAVPairsForEachMatcher,
			logicTableForEachMatcher: logicTableForEachMatcher
		};

		$.ajax({
			type: "POST",
		  	url: "/createPatternSplittingPoint/",
		  	data: JSON.stringify(query),
		  	contentType: "application/json; charset=utf-8",
		  	success: callback,
		  	dataType: "json"
		});
	},
	createMultipleSimpleSplittingPoints: function(panelID, ForSID, AVPairs, callback) {
		var query = {
			panelID: panelID,
			ForSID: ForSID,
			AVPairs: AVPairs
		};

		$.ajax({
			type: "POST",
		  	url: "/createMultipleSimpleSplittingPoints/",
		  	data: JSON.stringify(query),
		  	contentType: "application/json; charset=utf-8",
		  	success: callback,
		  	dataType: "json"
		});
	},
	removeSorF: function(panelID, ForSID, callback) {
		var query = {
			panelID: panelID,
			ForSID: ForSID
		}

		$.getJSON("/removeSorF/", query, function(response) {
			callback(response);
		});
	},
	mineFrequentPattern: function(panelID, ForSID, outputType, minSup, attributeName, callback) {
		var query = {
			panelID: panelID,
			ForSID: ForSID,
			outputType: outputType,
			minSup: minSup,
			attributeName: attributeName
		};

		$.getJSON("/mineFrequentPattern/", query, function(response) {
			callback(response);
		});
	},
	getRawSequences: function(panelID, ForSID, outputType, numberOfSequencesRequested, attributeName, callback) {
		var query = {
			panelID: panelID,
			ForSID: ForSID,
			outputType: outputType,
			attributeName: attributeName,
			numberOfSequencesRequested: numberOfSequencesRequested
		};

		$.getJSON("/getRawSequences/", query, function(response) {
			callback(response);
		});
	}
}