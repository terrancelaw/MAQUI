var ColourManager = {
	colours: [
		"#c2c7e8", "#ffbb78", "#98df8a", "#ff9896", "#c5b0d5", "#c49c94", "#f7b6d2", "#dbdb8d", "#9edae5",
		"#1f77b4", "#e17f0e", "#2ca02c", "#d62728", "#9467bd", "#8c564b", "#e377c2", "#bcbd22", "#17becf"
	],
	colourToColourKeyDict: {},

	getColour: function(colourKey, createNewIfNotExist = true) {
		var self = this;
		
		if (colourKey == "Start" || colourKey == "End")
			return FunnelVis.linkColour.dark;

		for (var colour in self.colourToColourKeyDict)
			if (colourKey == self.colourToColourKeyDict[colour])
				return colour;

		if (createNewIfNotExist) {
			for (var i = 0; i < self.colours.length; i++) {
				var currentColour = self.colours[i];
				var canUseTheColour = !(currentColour in self.colourToColourKeyDict);

				if (canUseTheColour) {
					self.colourToColourKeyDict[currentColour] = colourKey;
					return currentColour;
				}
			}
		}

		return "white"; // if colours are not enough or if not create new
	},
	getForegroundTextColour: function(colourCode) {
		if (tinycolor(colourCode).isDark())
			return "white";
		else
			return "gray";
	},
	refreshColourMarkers: function() {
		var self = this;
		var allColourKeys = {};

		// collect all colour keys which exists
		d3.selectAll(".colour-marker.active").each(function() {
			var currentColourKey = d3.select(this).attr("colour-key");
			allColourKeys[currentColourKey] = null;
		});

		// remove old from dictionary
		for (var colour in self.colourToColourKeyDict) {
			var currentColourKey = self.colourToColourKeyDict[colour];

			if (!(currentColourKey in allColourKeys))
				delete self.colourToColourKeyDict[colour];
		}

		// add new to dictionary
		var allColourKeysInDict = [];
		for (var colour in self.colourToColourKeyDict)
			allColourKeysInDict.push(self.colourToColourKeyDict[colour]);

		for (var colourKey in allColourKeys) {
			if (allColourKeysInDict.indexOf(colourKey) == -1 && colourKey !== "Start" && colourKey !== "End") {
				for (var i = 0; i < self.colours.length; i++) {
					var currentColour = self.colours[i];
					var canUseTheColour = !(currentColour in self.colourToColourKeyDict);

					if (canUseTheColour) {
						self.colourToColourKeyDict[currentColour] = colourKey;
						break;
					}
				}
			}
		}

		// update all colour markers
		d3.selectAll(".colour-marker").each(function() {
			var currentColourKey = d3.select(this).attr("colour-key");
			var backgroundColour = ColourManager.getColour(currentColourKey, false);
			var textColour = ColourManager.getForegroundTextColour(backgroundColour);
			var strokeColour = (backgroundColour == "white") ? FunnelVis.linkColour.dark : "white";
			var strokeWidth = (backgroundColour == "white") ? 1 : 2;

			d3.select(this).select("rect")
				.style("fill", backgroundColour)
				.style("stroke-width", strokeWidth)
				.style("stroke", strokeColour);
			d3.select(this).select("text")
				.style("fill", textColour);
		});
	}
}