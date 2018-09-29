var ShortNameManager = {
	longNameToFullName: {},
	fullNameToLongName: {},
	shortNameToFullName: {},
	fullNameToShortName: {},

	getShortName: function(fullName) {
		var self = this;
		var showLongName = $("#subsequence-view .toggle-name-btn").attr("state") == "long";
		var uncheckedLongName = "";
		var uncheckedShortName = "";
		var uniqueShortName = "";
		var nameIndex = 2;
		var isFullNameAVPair = fullName.indexOf("=") != -1;
		var isFullNameStored = fullName in self.fullNameToShortName;
		var isFullNamePattern = fullName.indexOf("untitled pattern") != -1 || fullName.indexOf("Frequent Pattern") != -1;

		if (fullName == "Start" || fullName == "End")
			return fullName;
		if (isFullNameStored && !showLongName)
			return self.fullNameToShortName[fullName];
		if (isFullNameStored && showLongName)
			return self.fullNameToLongName[fullName];

		// not registered, create unchecked short name and unchecked long name
		if (isFullNameAVPair) {
			var splittedString = fullName.split("=");
			var attributeValue = splittedString[1];

			uncheckedLongName = (attributeValue.length > 8) ? (attributeValue.substring(0, 8).toUpperCase() + "...") : attributeValue.toUpperCase();
			uncheckedShortName = attributeValue.substring(0, 2).toUpperCase();
			uniqueShortName = uncheckedShortName;
		}
		if (!isFullNameAVPair && !isFullNamePattern) {
			uncheckedLongName = (fullName.length > 8) ? (fullName.substring(0, 8).toUpperCase() + "...") : fullName.toUpperCase();
			uncheckedShortName = fullName.substring(0, 2).toUpperCase();
			uniqueShortName = uncheckedShortName;
		}
		if (!isFullNameAVPair && isFullNamePattern) {
			uncheckedLongName = "PATTERN";
			uncheckedShortName = "PT";
			uniqueShortName = uncheckedShortName;
		}

		// create unique short name
		while (uniqueShortName in self.shortNameToFullName) { // not unique
			uniqueShortName = uncheckedShortName + nameIndex;
			nameIndex++;
		}

		// store the short name
		self.longNameToFullName[uncheckedLongName] = fullName;
		self.fullNameToLongName[fullName] = uncheckedLongName;
		self.shortNameToFullName[uniqueShortName] = fullName;
		self.fullNameToShortName[fullName] = uniqueShortName;

		return showLongName ? uncheckedLongName : uniqueShortName;
	}
}