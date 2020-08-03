from flask import Flask, jsonify, request
from datetime import datetime, timedelta
from collections import Counter
from operator import itemgetter
from decimal import Decimal
import subprocess
import atexit
import os
import math

from globalVariables import *
import dataLoader
import helper

app = Flask(__name__, static_folder='../static', static_url_path="")

@app.route("/")
def root():
    return app.send_static_file("index.html")

@app.route("/initFandSForNewPanel/")
def initFandSForNewPanel():
    global FandS
    panelIDOfStartingSeq = request.args["panelID"]
    ForSIDOfStartingSeq = request.args["ForSID"]
    outputTypeOfStartingSeq = request.args["outputType"]
    clearPrevious = request.args["clearPrevious"]

    isPanelShowingAllSeq = panelIDOfStartingSeq == "0" and ForSIDOfStartingSeq == "0" and outputTypeOfStartingSeq == "0"
    currentPanelHasFilters = not isPanelShowingAllSeq and helper.hasFilters(panelIDOfStartingSeq)
    timeAndEventCountFilterList = [] # return to client

    startingEventSequencesByID = eventSequencesByID
    startingFilterName = "Start"
    trueStartByID = {}
    trueEndByID = {}

    if clearPrevious == "true":
        FandS.clear()

    if isPanelShowingAllSeq:
        for ID in startingEventSequencesByID:
            numberOfEventsForCurrentSequence = len(startingEventSequencesByID[ID])
            firstEvent = startingEventSequencesByID[ID][0]
            lastEvent = startingEventSequencesByID[ID][numberOfEventsForCurrentSequence - 1]
            trueStartTime = datetime.strptime(firstEvent[0], "%Y-%m-%dT%H:%M:%SZ")
            trueEndTime = datetime.strptime(lastEvent[0], "%Y-%m-%dT%H:%M:%SZ")
            trueStartByID[ID] = trueStartTime
            trueEndByID[ID] = trueEndTime

    if not isPanelShowingAllSeq and not currentPanelHasFilters:
        startingEventSequencesByID = FandS[panelIDOfStartingSeq][ForSIDOfStartingSeq]["output"][outputTypeOfStartingSeq]
        startingFilterName = FandS[panelIDOfStartingSeq][ForSIDOfStartingSeq]["name"]
        trueStartByID = FandS[panelIDOfStartingSeq][ForSIDOfStartingSeq]["trueStart"][outputTypeOfStartingSeq]
        trueEndByID = FandS[panelIDOfStartingSeq][ForSIDOfStartingSeq]["trueEnd"][outputTypeOfStartingSeq]

    if not isPanelShowingAllSeq and currentPanelHasFilters:
        results = helper.getIDListSatisfiedEventCountAndTime(panelIDOfStartingSeq)
        IDListSatisfiedEventCountAndTime = results["IDListSatisfiedEventCountAndTime"]
        timeAndEventCountFilterList = results["timeAndEventCountFilterList"]
        resultsWithoutFilters = helper.getStartingSeqWithoutFilters(panelIDOfStartingSeq, ForSIDOfStartingSeq, outputTypeOfStartingSeq, IDListSatisfiedEventCountAndTime)
        startingFilterName = FandS[panelIDOfStartingSeq][ForSIDOfStartingSeq]["name"]
        startingEventSequencesByID = resultsWithoutFilters["startingEventSequencesByID"]
        trueStartByID = resultsWithoutFilters["trueStartByID"]
        trueEndByID = resultsWithoutFilters["trueEndByID"]

    # create new panel
    newPanelID = helper.getNewPanelID()
    FandS[newPanelID] = {}
    FandS[newPanelID]["0"] = {
        "name": startingFilterName,
        "input": "0-after",  # input and output are the same
        "output": { "after": startingEventSequencesByID },
        "averageTime": { "after": None },
        "averageNumberOfEvents": { "after": None },
        "applyToSequences": False,
        "applyToRecordAttributes": True,
        "trueStart": { "after": trueStartByID },
        "trueEnd": { "after": trueEndByID }
    }

    # prevent division by zero
    if len(startingEventSequencesByID) == 0:
        FandS[newPanelID]["0"]["averageTime"]["after"] = 0
        FandS[newPanelID]["0"]["averageNumberOfEvents"]["after"] = 0

    # compute averageTime and averageNumberOfEvents
    else:
        sumOfTime = 0
        sumOfNumberOfEvents = 0

        for ID in startingEventSequencesByID:
            # add to sumOfNumberOfEvents
            numberOfEventsForCurrentSequence = len(startingEventSequencesByID[ID])
            sumOfNumberOfEvents += numberOfEventsForCurrentSequence

            # add to sumOfTime
            startTimeObject = FandS[newPanelID]["0"]["trueStart"]["after"][ID]
            endTimeObject = FandS[newPanelID]["0"]["trueEnd"]["after"][ID]
            deltaT = endTimeObject - startTimeObject
            deltaTInSecond = deltaT.total_seconds()
            sumOfTime += deltaTInSecond

        averageTime = sumOfTime / len(startingEventSequencesByID)
        averageNumberOfEvents = sumOfNumberOfEvents / len(startingEventSequencesByID)
        FandS[newPanelID]["0"]["averageTime"]["after"] = averageTime
        FandS[newPanelID]["0"]["averageNumberOfEvents"]["after"] = averageNumberOfEvents

    # add back the filters on the clicked panel
    if not isPanelShowingAllSeq and currentPanelHasFilters:

        # get all filters in the clicked panel except eventCount or time
        currentForSID = "0"
        allFiltersOnPanel = []

        while currentForSID != None:
            isFilter = FandS[panelIDOfStartingSeq][currentForSID]["applyToRecordAttributes"]
            isNumerical = "<=" in FandS[panelIDOfStartingSeq][currentForSID]["name"]
            isEventCountOrTime = False

            if isNumerical:
                splittedName = FandS[panelIDOfStartingSeq][currentForSID]["name"].split("<=")
                recordAttributeName = splittedName[1]
                isEventCountOrTime = (recordAttributeName == "eventCount") or (recordAttributeName == "time")

            # push filter only if it is not eventCount or time
            if isFilter and not isEventCountOrTime and currentForSID != "0":
                allFiltersOnPanel.append(FandS[panelIDOfStartingSeq][currentForSID])

            currentForSID = helper.getNextForSID(panelIDOfStartingSeq, currentForSID)

        # create FandS for each filter
        previousForSID = "0"

        for filter in allFiltersOnPanel:
            newForSID = helper.getNewForSID(newPanelID)
            filterName = filter["name"]

            FandS[newPanelID][newForSID] = {
                "name": filterName,
                "input": previousForSID + "-after",
                "output": None,
                "averageTime": { "after": None },
                "averageNumberOfEvents": { "after": None },
                "applyToSequences": False,
                "applyToRecordAttributes": True,
                "trueStart": { "after": {} },
                "trueEnd": { "after": {} }
            }

            previousForSID = newForSID

        # update output of all FandS
        currentFilterID = helper.getNextForSID(newPanelID, "0")

        while currentFilterID != None:
            isNumerical = "<=" in FandS[newPanelID][currentFilterID]["name"]

            if not isNumerical:
                helper.updateCategoricalFilterOutput(newPanelID, currentFilterID)
            if isNumerical:
                helper.updateNumericalFilterOutput(newPanelID, currentFilterID)

            currentFilterID = helper.getNextForSID(newPanelID, currentFilterID)

    response = {
        "newPanelID": newPanelID,
        "minifiedFandS": helper.createMinifiedFandS(),
        "timeAndEventCountFilterList": timeAndEventCountFilterList
    }

    return jsonify(response)

@app.route("/removePanel/<panelID>/")
def removePanel(panelID):
    del FandS[panelID]

    response = {
        "deletedPanelID": panelID,
        "minifiedFandS": helper.createMinifiedFandS()
    }

    return jsonify(response)

@app.route("/getAttributeList/<attributeType>/")
def getAttributeList(attributeType):
    attributeList = []

    if attributeType == "event" or attributeType == "all":
        attributeNameList = list(eventAttrNameToEventAttrIndexDict.keys())

        for attributeName in attributeNameList:
            attributeList.append({
                "attributeName": attributeName,
                "attributeType": "event",
                "numericalOrCategorical": "categorical"
            })

    if attributeType == "record" or attributeType == "all":
        attributeNameList = list(recordAttrNameToRecordAttrIndexDict.keys())

        for attributeName in attributeNameList:
            attributeList.append({
                "attributeName": attributeName,
                "attributeType": "record",
                "numericalOrCategorical": recordAttrNameToNumericalOrCategoricalDict[attributeName]
            })

        # append the two artificial attributes
        attributeList.append({ "attributeName": "eventCount", "attributeType": "record", "numericalOrCategorical": "numerical" })
        attributeList.append({"attributeName": "time", "attributeType": "record", "numericalOrCategorical": "numerical"})

    return jsonify(attributeList)

@app.route("/getValueList/")
def getValueList():
    panelID = request.args["panelID"]
    ForSID = request.args["ForSID"]
    outputType = request.args["outputType"]
    attributeName = request.args["attributeName"]
    attributeType = request.args["attributeType"]

    isUsingPatternEditor = panelID == "0" and ForSID == "0" and outputType == "0"
    selectedSubsequences = {}
    valueList = []

    if isUsingPatternEditor:
        selectedSubsequences = eventSequencesByID
    if not isUsingPatternEditor:
        selectedSubsequences = FandS[panelID][ForSID]["output"][outputType]

    if attributeType == "record":
        recordAttrIndex = recordAttrNameToRecordAttrIndexDict[attributeName]
        allValues = []

        for currentID in selectedSubsequences:
            currentValue = recordAttributesByID[currentID][recordAttrIndex]
            allValues.append(currentValue)

        valueCount = Counter(allValues)

    if attributeType == "event":
        eventAttrIndex = eventAttrNameToEventAttrIndexDict[attributeName]
        allValues = []

        # get valueSet
        for currentID in selectedSubsequences:
            valueSetForCurrentSequence = {}

            for currentEvent in selectedSubsequences[currentID]:
                for currentValue in currentEvent[eventAttrIndex]:
                    valueSetForCurrentSequence[currentValue] = 1

            for currentValue in valueSetForCurrentSequence:
                allValues.append(currentValue)

        valueCount = Counter(allValues)

    # create and sort list
    for value in valueCount:
        valueList.append({
            "value": value,
            "count": valueCount[value],
            "total": len(selectedSubsequences)
        })

    valueList = sorted(valueList, key=itemgetter("count"), reverse=True)

    return jsonify(valueList)

@app.route("/getDiscretizedNumericalAttrCount/")
def getDiscretizedNumericalAttrCount():
    panelID = request.args["panelID"]
    ForSID = request.args["ForSID"]
    outputType = request.args["outputType"]
    attributeName = request.args["attributeName"]

    eventSequencesForSearching = FandS[panelID][ForSID]["output"][outputType]
    allValues = []
    valueCount = {} # { bin, count }
    valueList = []

    # store the value list if the attributeName in data
    if attributeName in recordAttrNameToRecordAttrIndexDict:
        recordAttrIndex = recordAttrNameToRecordAttrIndexDict[attributeName]

        for ID in eventSequencesForSearching:
            currentValueString = recordAttributesByID[ID][recordAttrIndex]
            currentValue = float(currentValueString)
            allValues.append(currentValue)

    # store the value list if the attributeName is eventCount
    if attributeName == "eventCount":
        for ID in eventSequencesForSearching:
            currentEventCount = len(eventSequencesForSearching[ID])
            allValues.append(currentEventCount)

    # store the value list if the attributeName is time
    if attributeName == "time":
        for ID in eventSequencesForSearching:
            currentTrueEnd = FandS[panelID][ForSID]["trueEnd"][outputType][ID]
            currentTrueStart = FandS[panelID][ForSID]["trueStart"][outputType][ID]
            currentTimeDifference = currentTrueEnd - currentTrueStart
            currentTimeDifferenceInSecond = currentTimeDifference.total_seconds()
            allValues.append(currentTimeDifferenceInSecond)

    if len(allValues) == 0:
        return jsonify([])

    # find the binSize
    minValue = min(allValues)
    maxValue = max(allValues)
    binSize = (maxValue - minValue) / 10
    allBinIndices = []

    if binSize == 0:
        return jsonify([{
            "value": "{0:.1f}".format(minValue) + "<=" + attributeName + "<=" + "{0:.1f}".format(maxValue),
            "count": len(allValues),
            "total": len(eventSequencesForSearching)
        }])

    # count for different bins
    for currentValue in allValues:
        binIndex = math.floor((currentValue - minValue) / binSize)

        if binIndex > 9: # for max
            binIndex = 9

        allBinIndices.append(binIndex)

    valueCount = Counter(allBinIndices)

    # render response
    for binIndex in valueCount:
        valueList.append({
            "value": helper.generateBinNameForNumericalAttr(minValue, binSize, attributeName, 9, binIndex),
            "count": valueCount[binIndex],
            "total": len(eventSequencesForSearching),
            "binIndex": binIndex # for sorting
        })

    valueList = sorted(valueList, key=lambda k: k["binIndex"])

    return jsonify(valueList)

@app.route("/getMinMax/")
def getMinMax():
    panelID = request.args["panelID"]
    ForSID = request.args["ForSID"]
    outputType = request.args["outputType"]
    attributeName = request.args["attributeName"]

    eventSequencesForSearching = FandS[panelID][ForSID]["output"][outputType]
    min = float("inf")
    max = float("-inf")
    maxNumberOfDecimal = float("-inf")

    # attributeName in data
    if attributeName in recordAttrNameToRecordAttrIndexDict:
        recordAttrIndex = recordAttrNameToRecordAttrIndexDict[attributeName]

        for ID in eventSequencesForSearching:
            currentValueString = recordAttributesByID[ID][recordAttrIndex]
            currentValue = float(currentValueString)
            numberOfDecimal = abs(Decimal(currentValueString).as_tuple().exponent)

            if currentValue < min:
                min = currentValue
            if currentValue > max:
                max = currentValue
            if numberOfDecimal > maxNumberOfDecimal:
                maxNumberOfDecimal = numberOfDecimal

        if maxNumberOfDecimal > 2:
            maxNumberOfDecimal = 2

    # if attributeName is eventCount
    if attributeName == "eventCount":
        for ID in eventSequencesForSearching:
            currentEventCount = len(eventSequencesForSearching[ID])

            if currentEventCount < min:
                min = currentEventCount
            if currentEventCount > max:
                max = currentEventCount

        maxNumberOfDecimal = 0

    # if attributeName is time
    if attributeName == "time":
        for ID in eventSequencesForSearching:
            currentTrueEnd = FandS[panelID][ForSID]["trueEnd"][outputType][ID]
            currentTrueStart = FandS[panelID][ForSID]["trueStart"][outputType][ID]
            currentTimeDifference = currentTrueEnd - currentTrueStart
            currentTimeDifferenceInSecond = currentTimeDifference.total_seconds()

            if currentTimeDifferenceInSecond < min:
                min = currentTimeDifferenceInSecond
            if currentTimeDifferenceInSecond > max:
                max = currentTimeDifferenceInSecond

        maxNumberOfDecimal = 0

    minMax = {
        "min": min,
        "max": max,
        "step": 1 / 10 ** maxNumberOfDecimal
    }

    return jsonify(minMax)

@app.route("/createSimpleSplittingPoint/")
def createSimpleSplittingPoint():
    global FandS
    panelIDOfInputSeq = request.args["panelID"]
    ForSIDOfInputSeq = request.args["ForSID"]
    selectedAttrName = request.args["attributeName"]
    selectedAttrValue = request.args["attributeValue"]

    # init FandS
    newForSID = helper.getNewForSID(panelIDOfInputSeq)

    FandS[panelIDOfInputSeq][newForSID] = {
        "name": selectedAttrName + "=" + selectedAttrValue,
        "input": ForSIDOfInputSeq + "-after", # input must be after
        "output": None,
        "averageTime": { "before": None, "after": None }, # in second
        "averageNumberOfEvents": { "before": None, "after": None },
        "applyToSequences": True,
        "applyToRecordAttributes": False,
        "trueStart": { "before": {}, "after": {}, "not": {} },
        "trueEnd": { "before": {}, "after": {}, "not": {} }
    }

    # update output, averageTime, averageNumberOfEvents, trueStart and trueEnd
    helper.updateSimpleSPOutput(panelIDOfInputSeq, newForSID)

    # change input of the ForS with the same input as the created ForS
    ForSIDWithInputChanged = None

    for currentForSID in FandS[panelIDOfInputSeq]:
        if currentForSID != newForSID and currentForSID != ForSIDOfInputSeq: # a ForS can have its output as input
            inputStringOfUpdatedForS = ForSIDOfInputSeq + "-after"
            inputStringOfCurrentForS = FandS[panelIDOfInputSeq][currentForSID]["input"]

            if inputStringOfUpdatedForS == inputStringOfCurrentForS:
                ForSIDWithInputChanged = currentForSID
                FandS[panelIDOfInputSeq][currentForSID]["input"] = newForSID + "-after"
                break

    # update all subsequent ForS
    currentForSID = ForSIDWithInputChanged

    while currentForSID != None:
        isPatternSplittingPoint = "orderedAVPairsForEachMatcher" in FandS[panelIDOfInputSeq][currentForSID]

        if isPatternSplittingPoint:
            helper.updatePatternSPOutput(panelIDOfInputSeq, currentForSID)
        if not isPatternSplittingPoint:
            helper.updateSimpleSPOutput(panelIDOfInputSeq, currentForSID)

        currentForSID = helper.getNextForSID(panelIDOfInputSeq, currentForSID)

    response = {
        "updatedPanelID": panelIDOfInputSeq,
        "minifiedFandS": helper.createMinifiedFandS()
    }

    return jsonify(response)

@app.route("/createSimpleCategoricalFilter/")
def createSimpleCategoricalFilter():
    global FandS
    panelIDOfInputSeq = request.args["panelID"]
    ForSIDOfInputSeq = request.args["ForSID"]
    selectedAttrName = request.args["attributeName"]
    selectedAttrValue = request.args["attributeValue"]

    # init FandS
    newForSID = helper.getNewForSID(panelIDOfInputSeq)

    FandS[panelIDOfInputSeq][newForSID] = {
        "name": selectedAttrName + "=" + selectedAttrValue,
        "input": ForSIDOfInputSeq + "-after", # input must be after
        "output": None,
        "averageTime": { "after": None },
        "averageNumberOfEvents": { "after": None },
        "applyToSequences": False,
        "applyToRecordAttributes": True,
        "trueStart": { "after": {} },
        "trueEnd": { "after": {} }
    }

    # update output
    helper.updateCategoricalFilterOutput(panelIDOfInputSeq, newForSID)

    # change input of the ForS with the same input as the created ForS
    ForSIDWithInputChanged = None

    for currentForSID in FandS[panelIDOfInputSeq]:
        if currentForSID != newForSID and currentForSID != ForSIDOfInputSeq:  # a ForS can have its output as input
            inputStringOfUpdatedForS = ForSIDOfInputSeq + "-after"
            inputStringOfCurrentForS = FandS[panelIDOfInputSeq][currentForSID]["input"]

            if inputStringOfUpdatedForS == inputStringOfCurrentForS:
                ForSIDWithInputChanged = currentForSID
                FandS[panelIDOfInputSeq][currentForSID]["input"] = newForSID + "-after"
                break

    # update all subsequent ForS (all inputs are correct after the above step)
    currentForSID = ForSIDWithInputChanged

    while currentForSID != None:
        isPatternSplittingPoint = "orderedAVPairsForEachMatcher" in FandS[panelIDOfInputSeq][currentForSID]

        if isPatternSplittingPoint:
            helper.updatePatternSPOutput(panelIDOfInputSeq, currentForSID)
        if not isPatternSplittingPoint:
            helper.updateSimpleSPOutput(panelIDOfInputSeq, currentForSID)

        currentForSID = helper.getNextForSID(panelIDOfInputSeq, currentForSID)

    response = {
        "updatedPanelID": panelIDOfInputSeq,
        "minifiedFandS": helper.createMinifiedFandS()
    }

    return jsonify(response)

@app.route("/createSimpleNumericalFilter/")
def createSimpleNumericalFilter():
    global FandS
    panelIDOfInputSeq = request.args["panelID"]
    ForSIDOfInputSeq = request.args["ForSID"]
    selectedAttrName = request.args["attributeName"]
    selectedMinValue = request.args["minValue"]
    selectedMaxValue = request.args["maxValue"]
    displayString = request.args["displayString"]

    # init FandS
    newForSID = helper.getNewForSID(panelIDOfInputSeq)

    FandS[panelIDOfInputSeq][newForSID] = {
        "name": selectedMinValue + "<=" + selectedAttrName + "<=" + selectedMaxValue,
        "input": ForSIDOfInputSeq + "-after",  # input must be after
        "output": None,
        "averageTime": { "after": None },
        "averageNumberOfEvents": { "after": None },
        "applyToSequences": False,
        "applyToRecordAttributes": True,
        "trueStart": { "after": {} },
        "trueEnd": { "after": {} }
    }

    if displayString != "":
        FandS[panelIDOfInputSeq][newForSID]["displayString"] = displayString

    # update output
    helper.updateNumericalFilterOutput(panelIDOfInputSeq, newForSID)

    # change input of the ForS with the same input as the created ForS
    ForSIDWithInputChanged = None

    for currentForSID in FandS[panelIDOfInputSeq]:
        if currentForSID != newForSID and currentForSID != ForSIDOfInputSeq:  # a ForS can have its output as input
            inputStringOfUpdatedForS = ForSIDOfInputSeq + "-after"
            inputStringOfCurrentForS = FandS[panelIDOfInputSeq][currentForSID]["input"]

            if inputStringOfUpdatedForS == inputStringOfCurrentForS:
                ForSIDWithInputChanged = currentForSID
                FandS[panelIDOfInputSeq][currentForSID]["input"] = newForSID + "-after"
                break

    # update all subsequent ForS (all inputs are correct after the above step)
    currentForSID = ForSIDWithInputChanged

    while currentForSID != None:
        isPatternSplittingPoint = "orderedAVPairsForEachMatcher" in FandS[panelIDOfInputSeq][currentForSID]

        if isPatternSplittingPoint:
            helper.updatePatternSPOutput(panelIDOfInputSeq, currentForSID)
        if not isPatternSplittingPoint:
            helper.updateSimpleSPOutput(panelIDOfInputSeq, currentForSID)

        currentForSID = helper.getNextForSID(panelIDOfInputSeq, currentForSID)

    response = {
        "updatedPanelID": panelIDOfInputSeq,
        "minifiedFandS": helper.createMinifiedFandS()
    }

    return jsonify(response)

@app.route("/createPatternSplittingPoint/", methods=["POST"])
def createPatternSplittingPoint():
    global FandS
    data = request.get_json()
    panelIDOfInputSeq = data["panelID"]
    ForSIDOfInputSeq = data["ForSID"]
    name = data["name"]
    eventMatchers = data["eventMatchers"]
    orderedAVPairsForEachMatcher = data["orderedAVPairsForEachMatcher"]
    logicTableForEachMatcher = data["logicTableForEachMatcher"]

    # init FandS
    newForSID = helper.getNewForSID(panelIDOfInputSeq)

    FandS[panelIDOfInputSeq][newForSID] = {
        "name": name,
        "input": ForSIDOfInputSeq + "-after",  # input must be after
        "output": None,
        "averageTime": { "before": None, "after": None },  # in second
        "averageNumberOfEvents": { "before": None, "after": None },
        "applyToSequences": True,
        "applyToRecordAttributes": False,
        "trueStart": { "before": {}, "after": {}, "not": {} },
        "trueEnd": { "before": {}, "after": {}, "not": {} },
        "eventMatchers": eventMatchers,
        "orderedAVPairsForEachMatcher": orderedAVPairsForEachMatcher,
        "logicTableForEachMatcher": logicTableForEachMatcher
    }

    # update output, averageTime, averageNumberOfEvents, trueStart and trueEnd
    helper.updatePatternSPOutput(panelIDOfInputSeq, newForSID)

    # change input of the ForS with the same input as the created ForS
    ForSIDWithInputChanged = None

    for currentForSID in FandS[panelIDOfInputSeq]:
        if currentForSID != newForSID and currentForSID != ForSIDOfInputSeq:  # a ForS can have its output as input
            inputStringOfUpdatedForS = ForSIDOfInputSeq + "-after"
            inputStringOfCurrentForS = FandS[panelIDOfInputSeq][currentForSID]["input"]

            if inputStringOfUpdatedForS == inputStringOfCurrentForS:
                ForSIDWithInputChanged = currentForSID
                FandS[panelIDOfInputSeq][currentForSID]["input"] = newForSID + "-after"
                break

    # update all subsequent ForS
    currentForSID = ForSIDWithInputChanged

    while currentForSID != None:
        isPatternSplittingPoint = "orderedAVPairsForEachMatcher" in  FandS[panelIDOfInputSeq][currentForSID]

        if isPatternSplittingPoint:
            helper.updatePatternSPOutput(panelIDOfInputSeq, currentForSID)
        if not isPatternSplittingPoint:
            helper.updateSimpleSPOutput(panelIDOfInputSeq, currentForSID)

        currentForSID = helper.getNextForSID(panelIDOfInputSeq, currentForSID)

    response = {
        "updatedPanelID": panelIDOfInputSeq,
        "minifiedFandS": helper.createMinifiedFandS()
    }

    return jsonify(response)


@app.route("/createMultipleSimpleSplittingPoints/", methods=["POST"])
def createMultipleSimpleSplittingPoints(): # cascading add is not required because multiple splitting points are added to new panel
    global FandS
    data = request.get_json()
    panelIDOfInputSeq = data["panelID"]
    ForSIDOfInputSeq = data["ForSID"]
    AVPairs = data["AVPairs"]
    currentInputForSID = ForSIDOfInputSeq

    for AVPair in AVPairs:
        # handle for av pair
        if AVPair["type"] == "AVPair":
            attributeName = AVPair["attributeName"]
            attributeValue = AVPair["attributeValue"]

            # init FandS
            newForSID = helper.getNewForSID(panelIDOfInputSeq)

            FandS[panelIDOfInputSeq][newForSID] = {
                "name": attributeName + "=" + attributeValue,
                "input": currentInputForSID + "-after",  # input must be after
                "output": None,
                "averageTime": {"before": None, "after": None},  # in second
                "averageNumberOfEvents": {"before": None, "after": None},
                "applyToSequences": True,
                "applyToRecordAttributes": False,
                "trueStart": {"before": {}, "after": {}, "not": {}},
                "trueEnd": {"before": {}, "after": {}, "not": {}}
            }

            # update output, averageTime, averageNumberOfEvents, trueStart and trueEnd
            helper.updateSimpleSPOutput(panelIDOfInputSeq, newForSID)

        # handle for event with multiple av pair
        if AVPair["type"] == "Pattern":
            name = AVPair["name"]
            eventMatchers = AVPair["eventMatchers"]
            orderedAVPairsForEachMatcher = AVPair["orderedAVPairsForEachMatcher"]
            logicTableForEachMatcher = AVPair["logicTableForEachMatcher"]

            # init FandS
            newForSID = helper.getNewForSID(panelIDOfInputSeq)

            FandS[panelIDOfInputSeq][newForSID] = {
                "name": name,
                "input": ForSIDOfInputSeq + "-after",  # input must be after
                "output": None,
                "averageTime": {"before": None, "after": None},  # in second
                "averageNumberOfEvents": {"before": None, "after": None},
                "applyToSequences": True,
                "applyToRecordAttributes": False,
                "trueStart": {"before": {}, "after": {}, "not": {}},
                "trueEnd": {"before": {}, "after": {}, "not": {}},
                "eventMatchers": eventMatchers,
                "orderedAVPairsForEachMatcher": orderedAVPairsForEachMatcher,
                "logicTableForEachMatcher": logicTableForEachMatcher
            }

            # update output, averageTime, averageNumberOfEvents, trueStart and trueEnd
            helper.updatePatternSPOutput(panelIDOfInputSeq, newForSID)

        # update for next iteration
        currentInputForSID = newForSID

    response = {
        "updatedPanelID": panelIDOfInputSeq,
        "minifiedFandS": helper.createMinifiedFandS()
    }

    return jsonify(response)

@app.route("/removeSorF/")
def removeSorF():
    global FandS
    panelID = request.args["panelID"]
    ForSIDToBeDeleted = request.args["ForSID"]

    inputStringOfDeletedForS = FandS[panelID][ForSIDToBeDeleted]["input"]
    ForSIDAfterDeletedForS = helper.getNextForSID(panelID, ForSIDToBeDeleted)

    if ForSIDAfterDeletedForS != None:
        # change input of next ForS
        FandS[panelID][ForSIDAfterDeletedForS]["input"] = inputStringOfDeletedForS

        # update all subsequent ForS
        currentForSID = ForSIDAfterDeletedForS

        while currentForSID != None:
            isSplittingPoint = FandS[panelID][currentForSID]["applyToSequences"]
            isPatternSplittingPoint = "orderedAVPairsForEachMatcher" in FandS[panelID][currentForSID]
            isNumerical = "<=" in FandS[panelID][currentForSID]["name"]

            if isSplittingPoint and isPatternSplittingPoint:
                helper.updatePatternSPOutput(panelID, currentForSID)
            if isSplittingPoint and not isPatternSplittingPoint:
                helper.updateSimpleSPOutput(panelID, currentForSID)
            if not isSplittingPoint and not isNumerical:
                helper.updateCategoricalFilterOutput(panelID, currentForSID)
            if not isSplittingPoint and isNumerical:
                helper.updateNumericalFilterOutput(panelID, currentForSID)

            currentForSID = helper.getNextForSID(panelID, currentForSID)

    del FandS[panelID][ForSIDToBeDeleted]

    response = {
        "updatedPanelID": panelID,
        "removedForSID": ForSIDToBeDeleted,
        "minifiedFandS": helper.createMinifiedFandS()
    }

    return jsonify(response)

@app.route("/mineFrequentPattern/")
def mineFrequentPattern():
    panelID = request.args["panelID"]
    ForSID = request.args["ForSID"]
    outputType = request.args["outputType"]
    minSup = float(request.args["minSup"])
    attributeName = request.args["attributeName"]

    inputEventSequencesByID = FandS[panelID][ForSID]["output"][outputType]
    eventAttrIndex = eventAttrNameToEventAttrIndexDict[attributeName]
    outputToInputFile = []
    trueMinSup = None
    tooManyFrequentPatterns = False

    # create the desired input format
    with open("input.txt", "w") as f:
        for ID in inputEventSequencesByID:
            currentSequenceString = ""

            for currentEvent in inputEventSequencesByID[ID]:
                for currentValue in currentEvent[eventAttrIndex]:
                    currentValueIndex = eventAttrValueToEventAttrValueIndexDict[currentValue]
                    currentSequenceString += str(currentValueIndex) + " "

                if len(currentEvent[eventAttrIndex]) > 0:
                    currentSequenceString += "-1 "

            if len(inputEventSequencesByID[ID]) > 0:
                currentSequenceString += "-2"
                outputToInputFile.append(currentSequenceString)
                f.write(currentSequenceString + "\n")

    # compute true minSup
    if len(outputToInputFile) <= 1:  # only one sequence, nothing to mine
        return jsonify({ "tooManyFrequentPatterns": False, "frequentPatterns": [] })
    if len(outputToInputFile) > 1:
        trueMinSup = minSup * len(inputEventSequencesByID) / len(outputToInputFile)

    # mine frequent patterns using VMSP
    open("output.txt", 'w').close() # create file
    command = ["java", "-jar", "spmf.jar", "run", "VMSP", "input.txt", "output.txt", str(trueMinSup)]

    try:
        miningSubprocess = subprocess.Popen(command, stdout=subprocess.PIPE)
        miningSubprocess.wait(5)
    except subprocess.TimeoutExpired:
        miningSubprocess.terminate()
        tooManyFrequentPatterns = True

    # read output
    frequentPatterns = []  # { pattern, count, total }

    with open("output.txt", "r") as f:
        for line in f.readlines():
            line = line.strip()
            rawPattern = line.split(" -1 ")
            support = int(rawPattern.pop().split(": ")[1])
            convertedPattern = []

            # convert pattern
            for valueIndexSet in rawPattern:
                moreThanOneAVPairInTheSet = " " in valueIndexSet
                currentAVPairSet = []

                if moreThanOneAVPairInTheSet:
                    valueIndexList = valueIndexSet.split(" ")

                    for valueIndex in valueIndexList:
                        attributeValue = eventAttrValueIndexToEventAttrValueDict[valueIndex]
                        currentAVPairSet.append(attributeName + "=" + attributeValue)

                if not moreThanOneAVPairInTheSet:
                    valueIndex = valueIndexSet
                    attributeValue = eventAttrValueIndexToEventAttrValueDict[valueIndex]
                    currentAVPairSet.append(attributeName + "=" + attributeValue)

                convertedPattern.append(currentAVPairSet)

            # get output frequent patterns
            frequentPatterns.append({
                "pattern": convertedPattern,
                "count": support,
                "total": len(inputEventSequencesByID)
            })

    # sort pattern by count
    frequentPatterns = sorted(frequentPatterns, key=lambda k: k["count"], reverse=True)

    response = {
        "tooManyFrequentPatterns": tooManyFrequentPatterns,
        "frequentPatterns": frequentPatterns
    }

    return jsonify(response)

@app.route("/getRawSequences/")
def getRawSequences():
    panelID = request.args["panelID"]
    ForSID = request.args["ForSID"]
    outputType = request.args["outputType"]
    attributeName = request.args["attributeName"]
    numberOfSequencesRequested = int(request.args["numberOfSequencesRequested"])

    eventAttrIndex = eventAttrNameToEventAttrIndexDict[attributeName]
    inputEventSequencesByID = FandS[panelID][ForSID]["output"][outputType]
    requestedSequences = []
    hasMoreToShow = False

    for ID in sorted(inputEventSequencesByID.keys()):
        convertedSequence = []

        for currentEvent in inputEventSequencesByID[ID]:
            convertedEvent = []

            for currentValue in currentEvent[eventAttrIndex]:
                convertedEvent.append(attributeName + "=" + currentValue)

            convertedSequence.append(convertedEvent)

        if len(convertedSequence) > 0:
            requestedSequences.append(convertedSequence)
        if len(requestedSequences) >= numberOfSequencesRequested + 1: # get one more to see if there is the next sequence
            break

    if len(requestedSequences) == numberOfSequencesRequested + 1:
        hasMoreToShow = True
        requestedSequences.pop()

    response = {
        "hasMoreToShow": hasMoreToShow,
        "rawSequences": requestedSequences
    }

    return jsonify(response)

@atexit.register
def removeIOFiles():
    os.remove("input.txt")
    os.remove("output.txt")

if __name__ == "__main__":
    dataLoader.load()
    app.run(host= '0.0.0.0')
