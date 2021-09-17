var Helper = {
	generateTimeString: function(timeInSecond) {
		if (timeInSecond < 1) {
			var timeInMillisecond = timeInSecond * 1000;
			var timeTwoDecimal = Math.round(timeInMillisecond * 10) / 10;
			return timeTwoDecimal > 1 ? timeTwoDecimal + " milliseconds" : timeTwoDecimal + " millisecond";
		}

		if (timeInSecond < 60) {
			var timeTwoDecimal = Math.round(timeInSecond * 10) / 10;
			return timeTwoDecimal > 1 ? timeTwoDecimal + " seconds" : timeTwoDecimal + " second";
		}

		var timeInMinute = timeInSecond / 60;
		if (timeInMinute < 60) {
			var timeTwoDecimal = Math.round(timeInMinute * 10) / 10;
			return timeTwoDecimal > 1 ? timeTwoDecimal + " minutes" : timeTwoDecimal + " minute";
		}

		var timeInHour = timeInMinute / 60;
		if (timeInHour < 24) {
			var timeTwoDecimal = Math.round(timeInHour * 10) / 10;
			return timeTwoDecimal > 1 ? timeTwoDecimal + " hours" : timeTwoDecimal + " hour";
		}

		var timeInDay = timeInHour / 24;
		var timeTwoDecimal = Math.round(timeInDay * 10) / 10;
		return timeTwoDecimal > 1 ? timeTwoDecimal + " days" : timeTwoDecimal + " day";
	},
	getTranslation: function(transform) {
		if (!transform)
			return [0, 0];

  		var g = document.createElementNS("http://www.w3.org/2000/svg", "g");
  		g.setAttributeNS(null, "transform", transform);
  		var matrix = g.transform.baseVal.consolidate().matrix;
  		return [matrix.e, matrix.f];
	},
	getXScaleDomain: function(isXScaleTime, isHScaleButtonSelected, numberOfSPoint, timeBeforeEnd, numberOfEventsBeforeEnd) {
		var xScaleDomain = [];

		if (isHScaleButtonSelected)
			xScaleDomain = [ 0, numberOfSPoint - 1 ];
		else if (isXScaleTime)
			xScaleDomain = [ 0, timeBeforeEnd ];
		else if (!isXScaleTime)
			xScaleDomain = [ 0, numberOfEventsBeforeEnd ];

		return xScaleDomain;
	},
	getDistanceBeforeThis: function(isXScaleTime, isHScaleButtonSelected, indexOfCurrent, timeBeforeCurrent, numberOfEventsBeforeCurrent) {
		if (isHScaleButtonSelected)
			return indexOfCurrent;
		else if (isXScaleTime)
			return timeBeforeCurrent;
		else if (!isXScaleTime)
			return numberOfEventsBeforeCurrent;
	},
	getDistanceBetweenThisAndPrevious: function(isXScaleTime, isHScaleButtonSelected, timeBetweenThisAndPrevious, numberOfEventsBetweenThisAndPrevious) {
		if (isHScaleButtonSelected)
			return 1;
		else if (isXScaleTime)
			return timeBetweenThisAndPrevious;
		else if (!isXScaleTime)
			return numberOfEventsBetweenThisAndPrevious;
	},
	getValueOfThis: function(isVScaleButtonSelected, SID, totalNumberOfSequences, indexOfCurrent, valueOfCurrent) {
		var power = indexOfCurrent;

		if (SID == "start" || SID == "end")
			return valueOfCurrent;

		if (isVScaleButtonSelected)
			return totalNumberOfSequences * Math.pow(0.7, power);
		else
			return valueOfCurrent;
	},
	createMatchers: function(pattern) {
		var matchers = [];

		for (var i = 0; i < pattern.length; i++) {
			var AVPairSet = pattern[i];
			var currentMatcher = [];

			// create one event matcher
			for (var j = 0; j < AVPairSet.length; j++) {
				var currentMatcherItem = {};
				var currentAVName = AVPairSet[j];
				var currentItemName = ShortNameManager.getShortName(currentAVName);
				var currentType = "AVPair";
				var currentSplittedName = currentAVName.split("=");
				var currentData = {
					attributeName: currentSplittedName[0],
					attributeValue: currentSplittedName[1]
				}

				// push the AVPair
				currentMatcherItem = { data: currentData, type: currentType, itemName: currentItemName };
				currentMatcher.push(currentMatcherItem);

				// push AND
				if (j != AVPairSet.length - 1) {
					ANDMatcherItem = { data: null, type: "operator", itemName: "AND" };
					currentMatcher.push(ANDMatcherItem);
				}
			}

			// store the event matcher
			matchers.push(currentMatcher);
		}

		return matchers;
	},
	computeTime: function(timeInSec, unit) {
		if (unit == "sec")
			return timeInSec;
		if (unit == "min")
			return Math.round(timeInSec / 60 * 10) / 10;
		if (unit == "hr")
			return Math.round(timeInSec / (60 * 60) * 10) / 10;
		if (unit == "day")
			return Math.round(timeInSec / (60 * 60 * 24) * 10) / 10;
	},
	computeTimeInSec: function(time, unit) {
		if (unit == "sec")
			return time;
		if (unit == "min")
			return time * 60;
		if (unit == "hr")
			return time * 60 * 60;
		if (unit == "day")
			return time * 24 * 60 * 60;
	}
}