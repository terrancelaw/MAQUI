from datetime import datetime, timedelta

from globalVariables import *

def isNumber(s):
    try:
        float(s)
        return True
    except ValueError:
        return False

def createMinifiedFandS():
    minifiedFandS = {}

    for panelID in FandS:
        minifiedFandS[panelID] = {}

        for ForSID in FandS[panelID]:
            minifiedFandS[panelID][ForSID] = {
                "name": FandS[panelID][ForSID]["name"],
                "input": FandS[panelID][ForSID]["input"],

                # attributes of filter or splitting points
                "applyToSequences": FandS[panelID][ForSID]["applyToSequences"],
                "applyToRecordAttributes": FandS[panelID][ForSID]["applyToRecordAttributes"],

                # attributes of output
                "numberOfSequences": {},
                "averageTime": {},
                "averageNumberOfEvents": {}
            }

            for outputType in FandS[panelID][ForSID]["output"]:
                minifiedFandS[panelID][ForSID]["numberOfSequences"][outputType] = len(FandS[panelID][ForSID]["output"][outputType])
            for outputType in FandS[panelID][ForSID]["averageTime"]:
                minifiedFandS[panelID][ForSID]["averageTime"][outputType] = FandS[panelID][ForSID]["averageTime"][outputType]
            for outputType in FandS[panelID][ForSID]["averageNumberOfEvents"]:
                minifiedFandS[panelID][ForSID]["averageNumberOfEvents"][outputType] = FandS[panelID][ForSID]["averageNumberOfEvents"][outputType]
            if "eventMatchers" in FandS[panelID][ForSID]:
                minifiedFandS[panelID][ForSID]["eventMatchers"] = FandS[panelID][ForSID]["eventMatchers"]
            if "displayString" in FandS[panelID][ForSID]:
                minifiedFandS[panelID][ForSID]["displayString"] = FandS[panelID][ForSID]["displayString"]

    return minifiedFandS

def updateSimpleSPOutput(panelID, ForSID):
    global FandS
    panelIDOfInputSeq = panelID
    splittedInputString = FandS[panelID][ForSID]["input"].split("-")
    ForSIDOfInputSeq = splittedInputString[0]
    outputTypeOfInputSeq = splittedInputString[1]
    splittedName = FandS[panelID][ForSID]["name"].split("=")
    sPointAttributeName = splittedName[0]
    sPointAttributeValue = splittedName[1]

    inputEventSequences = FandS[panelIDOfInputSeq][ForSIDOfInputSeq]["output"][outputTypeOfInputSeq]
    outputEventSequences = {"before": {}, "after": {}, "contain": {}, "not": {}}
    eventAttrIndex = eventAttrNameToEventAttrIndexDict[sPointAttributeName]

    sumOfTimeForBeforeSeq = 0
    sumOfTimeForAfterSeq = 0
    sumOfNumberOfEventsForBeforeSeq = 0
    sumOfNumberOfEventsForAfterSeq = 0

    trueStartForBeforeSeq = {}
    trueEndForBeforeSeq = {}
    trueStartForAfterSeq = {}
    trueEndForAfterSeq = {}
    trueStartForNotSeq = {}
    trueEndForNotSeq = {}

    for ID in inputEventSequences:
        currentBeforeSequence = []
        currentAfterSequence = []
        currentContainSequence = []
        currentNotSequence = []

        for index, event in enumerate(inputEventSequences[ID]):
            currentValueSetOfSelectedAttr = event[eventAttrIndex]

            if sPointAttributeValue in currentValueSetOfSelectedAttr:
                currentBeforeSequence = inputEventSequences[ID][0:index]
                currentAfterSequence = inputEventSequences[ID][index + 1:len(inputEventSequences[ID])]
                currentContainSequence = inputEventSequences[ID][index:index + 1]

                # store trueStart for before and after
                matchedEvent = inputEventSequences[ID][index]
                matchedEventTime = datetime.strptime(matchedEvent[0], "%Y-%m-%d %H:%M:%S")
                trueStartForBeforeSeq[ID] = FandS[panelIDOfInputSeq][ForSIDOfInputSeq]["trueStart"][outputTypeOfInputSeq][ID]
                trueStartForAfterSeq[ID] = matchedEventTime

                # store trueEnd for before and after
                trueEndForBeforeSeq[ID] = matchedEventTime
                trueEndForAfterSeq[ID] = FandS[panelIDOfInputSeq][ForSIDOfInputSeq]["trueEnd"][outputTypeOfInputSeq][ID]

                # add to before time
                timeDifference = trueEndForBeforeSeq[ID] - trueStartForBeforeSeq[ID]
                timeDifferenceInSecond = timeDifference.total_seconds()
                sumOfTimeForBeforeSeq += timeDifferenceInSecond

                # add to after time
                timeDifference = trueEndForAfterSeq[ID] - trueStartForAfterSeq[ID]
                timeDifferenceInSecond = timeDifference.total_seconds()
                sumOfTimeForAfterSeq += timeDifferenceInSecond

                # add to before and after number of events
                sumOfNumberOfEventsForBeforeSeq += len(currentBeforeSequence)
                sumOfNumberOfEventsForAfterSeq += len(currentAfterSequence)

                break

        # store output
        currentSequenceContainAVPair = len(currentContainSequence) != 0

        if currentSequenceContainAVPair:
            outputEventSequences["before"][ID] = currentBeforeSequence
            outputEventSequences["after"][ID] = currentAfterSequence
            outputEventSequences["contain"][ID] = currentContainSequence
        if not currentSequenceContainAVPair:
            currentNotSequence = inputEventSequences[ID]
            outputEventSequences["not"][ID] = currentNotSequence

            # store trueStart and trueEnd for not
            trueStartForNotSeq[ID] = FandS[panelIDOfInputSeq][ForSIDOfInputSeq]["trueStart"][outputTypeOfInputSeq][ID]
            trueEndForNotSeq[ID] = FandS[panelIDOfInputSeq][ForSIDOfInputSeq]["trueEnd"][outputTypeOfInputSeq][ID]

    # handling non-existence bug
    if len(outputEventSequences["contain"]) == 0:
        FandS[panelID][ForSID]["output"] = outputEventSequences
        FandS[panelID][ForSID]["averageTime"]["before"] = 0
        FandS[panelID][ForSID]["averageTime"]["after"] = 0
        FandS[panelID][ForSID]["averageNumberOfEvents"]["before"] = 0
        FandS[panelID][ForSID]["averageNumberOfEvents"]["after"] = 0
        FandS[panelID][ForSID]["trueStart"]["before"] = trueStartForBeforeSeq
        FandS[panelID][ForSID]["trueStart"]["after"] = trueStartForAfterSeq
        FandS[panelID][ForSID]["trueStart"]["not"] = trueStartForNotSeq
        FandS[panelID][ForSID]["trueEnd"]["before"] = trueEndForBeforeSeq
        FandS[panelID][ForSID]["trueEnd"]["after"] = trueEndForAfterSeq
        FandS[panelID][ForSID]["trueEnd"]["not"] = trueEndForNotSeq
        return

    # save to FandS
    averageTimeForBeforeSeq = sumOfTimeForBeforeSeq / len(outputEventSequences["before"])
    averageTimeForAfterSeq = sumOfTimeForAfterSeq / len(outputEventSequences["after"])
    averageNumberOfEventsForBeforeSeq = sumOfNumberOfEventsForBeforeSeq / len(outputEventSequences["before"])
    averageNumberOfEventsForAfterSeq = sumOfNumberOfEventsForAfterSeq / len(outputEventSequences["after"])

    FandS[panelID][ForSID]["output"] = outputEventSequences
    FandS[panelID][ForSID]["averageTime"]["before"] = averageTimeForBeforeSeq
    FandS[panelID][ForSID]["averageTime"]["after"] = averageTimeForAfterSeq
    FandS[panelID][ForSID]["averageNumberOfEvents"]["before"] = averageNumberOfEventsForBeforeSeq
    FandS[panelID][ForSID]["averageNumberOfEvents"]["after"] = averageNumberOfEventsForAfterSeq
    FandS[panelID][ForSID]["trueStart"]["before"] = trueStartForBeforeSeq
    FandS[panelID][ForSID]["trueStart"]["after"] = trueStartForAfterSeq
    FandS[panelID][ForSID]["trueStart"]["not"] = trueStartForNotSeq
    FandS[panelID][ForSID]["trueEnd"]["before"] = trueEndForBeforeSeq
    FandS[panelID][ForSID]["trueEnd"]["after"] = trueEndForAfterSeq
    FandS[panelID][ForSID]["trueEnd"]["not"] = trueEndForNotSeq

def updatePatternSPOutput(panelID, ForSID):
    global FandS
    panelIDOfInputSeq = panelID
    splittedInputString = FandS[panelID][ForSID]["input"].split("-")
    ForSIDOfInputSeq = splittedInputString[0]
    outputTypeOfInputSeq = splittedInputString[1]
    orderedAVPairsForEachMatcher = FandS[panelID][ForSID]["orderedAVPairsForEachMatcher"]
    logicTableForEachMatcher = FandS[panelID][ForSID]["logicTableForEachMatcher"]

    inputEventSequences = FandS[panelIDOfInputSeq][ForSIDOfInputSeq]["output"][outputTypeOfInputSeq]
    outputEventSequences = { "before": {}, "after": {}, "contain": {}, "not": {} }

    sumOfTimeForBeforeSeq = 0
    sumOfTimeForAfterSeq = 0
    sumOfNumberOfEventsForBeforeSeq = 0
    sumOfNumberOfEventsForAfterSeq = 0

    trueStartForBeforeSeq = {}
    trueEndForBeforeSeq = {}
    trueStartForAfterSeq = {}
    trueEndForAfterSeq = {}
    trueStartForNotSeq = {}
    trueEndForNotSeq = {}

    for ID in inputEventSequences:
        currentBeforeSequence = []
        currentAfterSequence = []
        currentContainSequence = []
        currentNotSequence = []

        indexOfCurrentEventMatcher = 0
        matchedPatternStartIndex = None
        matchedPatternEndIndex = None
        currentSeqContainsThePattern = False

        for index, event in enumerate(inputEventSequences[ID]):
            currentAVPairs = orderedAVPairsForEachMatcher[indexOfCurrentEventMatcher]
            binaryIndexString = ""  # index = 0 corr to right most position

            # create binary index to logic table
            for AVPair in currentAVPairs:
                currentAttributeName = AVPair["attributeName"]
                currentAttributeValue =  AVPair["attributeValue"]
                currentEventAttrIndex = eventAttrNameToEventAttrIndexDict[currentAttributeName]
                valueSetOfCurrentEventAttr = event[currentEventAttrIndex]

                if currentAttributeValue in valueSetOfCurrentEventAttr:
                    binaryIndexString = "1" + binaryIndexString
                else:
                    binaryIndexString = "0" + binaryIndexString

            # convert binary number index to decimal value
            decimalIndex = int(binaryIndexString, 2)

            # get match or not match from table
            currentLogicTable = logicTableForEachMatcher[indexOfCurrentEventMatcher]
            currentEventMatchesEventMatcher = currentLogicTable[decimalIndex]

            # if matched, increment indexOfCurrentEventMatcher
            if currentEventMatchesEventMatcher:
                indexOfCurrentEventMatcher += 1

            # if is match with first matcher
            if currentEventMatchesEventMatcher and matchedPatternStartIndex == None:
                matchedPatternStartIndex = index

            # if matched with last matcher (match all)
            if indexOfCurrentEventMatcher == len(orderedAVPairsForEachMatcher):
                matchedPatternEndIndex = index
                currentSeqContainsThePattern = True

                currentBeforeSequence = inputEventSequences[ID][0:matchedPatternStartIndex]
                currentAfterSequence = inputEventSequences[ID][matchedPatternEndIndex + 1:len(inputEventSequences[ID])]
                currentContainSequence = inputEventSequences[ID][matchedPatternStartIndex:matchedPatternEndIndex + 1]

                # store trueStart for before and after
                endEventInMatchedPattern = inputEventSequences[ID][matchedPatternEndIndex]
                timeOfEndEventInMatchedPattern = datetime.strptime(endEventInMatchedPattern[0], "%Y-%m-%d %H:%M:%S")
                trueStartForBeforeSeq[ID] = FandS[panelIDOfInputSeq][ForSIDOfInputSeq]["trueStart"][outputTypeOfInputSeq][ID]
                trueStartForAfterSeq[ID] = timeOfEndEventInMatchedPattern

                # store trueEnd for before and after
                startEventInMatchedPattern = inputEventSequences[ID][matchedPatternStartIndex]
                timeOfStartEventInMatchedPattern = datetime.strptime(startEventInMatchedPattern[0], "%Y-%m-%d %H:%M:%S")
                trueEndForBeforeSeq[ID] = timeOfStartEventInMatchedPattern
                trueEndForAfterSeq[ID] = FandS[panelIDOfInputSeq][ForSIDOfInputSeq]["trueEnd"][outputTypeOfInputSeq][ID]

                # add to before time
                timeDifference = trueEndForBeforeSeq[ID] - trueStartForBeforeSeq[ID]
                timeDifferenceInSecond = timeDifference.total_seconds()
                sumOfTimeForBeforeSeq += timeDifferenceInSecond

                # add to after time
                timeDifference = trueEndForAfterSeq[ID] - trueStartForAfterSeq[ID]
                timeDifferenceInSecond = timeDifference.total_seconds()
                sumOfTimeForAfterSeq += timeDifferenceInSecond

                # add to before and after number of events
                sumOfNumberOfEventsForBeforeSeq += len(currentBeforeSequence)
                sumOfNumberOfEventsForAfterSeq += len(currentAfterSequence)

                break

        # store output
        if currentSeqContainsThePattern:
            outputEventSequences["before"][ID] = currentBeforeSequence
            outputEventSequences["after"][ID] = currentAfterSequence
            outputEventSequences["contain"][ID] = currentContainSequence
        if not currentSeqContainsThePattern:
            currentNotSequence = inputEventSequences[ID]
            outputEventSequences["not"][ID] = currentNotSequence

            # store trueStart and trueEnd for not
            trueStartForNotSeq[ID] = FandS[panelIDOfInputSeq][ForSIDOfInputSeq]["trueStart"][outputTypeOfInputSeq][ID]
            trueEndForNotSeq[ID] = FandS[panelIDOfInputSeq][ForSIDOfInputSeq]["trueEnd"][outputTypeOfInputSeq][ID]

    # handling non-existence bug
    if len(outputEventSequences["contain"]) == 0:
        FandS[panelID][ForSID]["output"] = outputEventSequences
        FandS[panelID][ForSID]["averageTime"]["before"] = 0
        FandS[panelID][ForSID]["averageTime"]["after"] = 0
        FandS[panelID][ForSID]["averageNumberOfEvents"]["before"] = 0
        FandS[panelID][ForSID]["averageNumberOfEvents"]["after"] = 0
        FandS[panelID][ForSID]["trueStart"]["before"] = trueStartForBeforeSeq
        FandS[panelID][ForSID]["trueStart"]["after"] = trueStartForAfterSeq
        FandS[panelID][ForSID]["trueStart"]["not"] = trueStartForNotSeq
        FandS[panelID][ForSID]["trueEnd"]["before"] = trueEndForBeforeSeq
        FandS[panelID][ForSID]["trueEnd"]["after"] = trueEndForAfterSeq
        FandS[panelID][ForSID]["trueEnd"]["not"] = trueEndForNotSeq
        return

    # save to FandS
    averageTimeForBeforeSeq = sumOfTimeForBeforeSeq / len(outputEventSequences["before"])
    averageTimeForAfterSeq = sumOfTimeForAfterSeq / len(outputEventSequences["after"])
    averageNumberOfEventsForBeforeSeq = sumOfNumberOfEventsForBeforeSeq / len(outputEventSequences["before"])
    averageNumberOfEventsForAfterSeq = sumOfNumberOfEventsForAfterSeq / len(outputEventSequences["after"])

    FandS[panelID][ForSID]["output"] = outputEventSequences
    FandS[panelID][ForSID]["averageTime"]["before"] = averageTimeForBeforeSeq
    FandS[panelID][ForSID]["averageTime"]["after"] = averageTimeForAfterSeq
    FandS[panelID][ForSID]["averageNumberOfEvents"]["before"] = averageNumberOfEventsForBeforeSeq
    FandS[panelID][ForSID]["averageNumberOfEvents"]["after"] = averageNumberOfEventsForAfterSeq
    FandS[panelID][ForSID]["trueStart"]["before"] = trueStartForBeforeSeq
    FandS[panelID][ForSID]["trueStart"]["after"] = trueStartForAfterSeq
    FandS[panelID][ForSID]["trueStart"]["not"] = trueStartForNotSeq
    FandS[panelID][ForSID]["trueEnd"]["before"] = trueEndForBeforeSeq
    FandS[panelID][ForSID]["trueEnd"]["after"] = trueEndForAfterSeq
    FandS[panelID][ForSID]["trueEnd"]["not"] = trueEndForNotSeq

def updateCategoricalFilterOutput(panelID, ForSID):
    global FandS
    panelIDOfInputSeq = panelID
    splittedInputString = FandS[panelID][ForSID]["input"].split("-")
    ForSIDOfInputSeq = splittedInputString[0]
    outputTypeOfInputSeq = splittedInputString[1]
    splittedName = FandS[panelID][ForSID]["name"].split("=")
    recordAttributeName = splittedName[0]
    selectedAttributeValue = splittedName[1]

    inputEventSequences = FandS[panelIDOfInputSeq][ForSIDOfInputSeq]["output"][outputTypeOfInputSeq]
    outputEventSequences = { "after": {} }
    recordAttrIndex = recordAttrNameToRecordAttrIndexDict[recordAttributeName]

    sumOfTimeForAfterSeq = 0
    sumOfNumberOfEventsForAfterSeq = 0
    trueStartForAfterSeq = {}
    trueEndForAfterSeq = {}

    for ID in inputEventSequences:
        currentValue = recordAttributesByID[ID][recordAttrIndex]

        if currentValue == selectedAttributeValue:
            # store output
            outputEventSequences["after"][ID] = inputEventSequences[ID]

            # update trueStart and trueEnd
            trueStartForAfterSeq[ID] = FandS[panelIDOfInputSeq][ForSIDOfInputSeq]["trueStart"][outputTypeOfInputSeq][ID]
            trueEndForAfterSeq[ID] = FandS[panelIDOfInputSeq][ForSIDOfInputSeq]["trueEnd"][outputTypeOfInputSeq][ID]

            # add to after time
            timeDifference = trueEndForAfterSeq[ID] - trueStartForAfterSeq[ID]
            timeDifferenceInSecond = timeDifference.total_seconds()
            sumOfTimeForAfterSeq += timeDifferenceInSecond

            # add to after number of events
            sumOfNumberOfEventsForAfterSeq += len(inputEventSequences[ID])

    # handling potential non-existence bug (prevent division by zero)
    if len(outputEventSequences["after"]) == 0:
        FandS[panelID][ForSID]["output"] = outputEventSequences
        FandS[panelID][ForSID]["averageTime"]["after"] = 0
        FandS[panelID][ForSID]["averageNumberOfEvents"]["after"] = 0
        FandS[panelID][ForSID]["trueStart"]["after"] = 0
        FandS[panelID][ForSID]["trueEnd"]["after"] = 0
        return

    # save to FandS
    averageTimeForAfterSeq = sumOfTimeForAfterSeq / len(outputEventSequences["after"])
    averageNumberOfEventsForAfterSeq = sumOfNumberOfEventsForAfterSeq / len(outputEventSequences["after"])

    FandS[panelID][ForSID]["output"] = outputEventSequences
    FandS[panelID][ForSID]["averageTime"]["after"] = averageTimeForAfterSeq
    FandS[panelID][ForSID]["averageNumberOfEvents"]["after"] = averageNumberOfEventsForAfterSeq
    FandS[panelID][ForSID]["trueStart"]["after"] = trueStartForAfterSeq
    FandS[panelID][ForSID]["trueEnd"]["after"] = trueEndForAfterSeq

def updateNumericalFilterOutput(panelID, ForSID):
    global FandS
    panelIDOfInputSeq = panelID
    splittedInputString = FandS[panelID][ForSID]["input"].split("-")
    ForSIDOfInputSeq = splittedInputString[0]
    outputTypeOfInputSeq = splittedInputString[1]
    splittedName = FandS[panelID][ForSID]["name"].split("<=")
    recordAttributeName = splittedName[1]
    minValue = float(splittedName[0])
    maxValue = float(splittedName[2])

    inputEventSequences = FandS[panelIDOfInputSeq][ForSIDOfInputSeq]["output"][outputTypeOfInputSeq]
    outputEventSequences = { "after": {} }

    sumOfTimeForAfterSeq = 0
    sumOfNumberOfEventsForAfterSeq = 0
    trueStartForAfterSeq = {}
    trueEndForAfterSeq = {}

    # if recordAttributeName in data
    if recordAttributeName in recordAttrNameToRecordAttrIndexDict:
        recordAttrIndex = recordAttrNameToRecordAttrIndexDict[recordAttributeName]

        for ID in inputEventSequences:
            currentValue = float(recordAttributesByID[ID][recordAttrIndex])

            if currentValue >= minValue and currentValue <= maxValue:
                # store output
                outputEventSequences["after"][ID] = inputEventSequences[ID]

                # update trueStart and trueEnd
                trueStartForAfterSeq[ID] = FandS[panelIDOfInputSeq][ForSIDOfInputSeq]["trueStart"][outputTypeOfInputSeq][ID]
                trueEndForAfterSeq[ID] = FandS[panelIDOfInputSeq][ForSIDOfInputSeq]["trueEnd"][outputTypeOfInputSeq][ID]

                # add to after time
                timeDifference = trueEndForAfterSeq[ID] - trueStartForAfterSeq[ID]
                timeDifferenceInSecond = timeDifference.total_seconds()
                sumOfTimeForAfterSeq += timeDifferenceInSecond

                # add to after number of events
                sumOfNumberOfEventsForAfterSeq += len(inputEventSequences[ID])

    # if recordAttributeName is eventCount
    if recordAttributeName == "eventCount":
        for ID in inputEventSequences:
            currentEventCount = len(inputEventSequences[ID])

            if currentEventCount >= minValue and currentEventCount <= maxValue:
                # store output
                outputEventSequences["after"][ID] = inputEventSequences[ID]

                # update trueStart and trueEnd
                trueStartForAfterSeq[ID] = FandS[panelIDOfInputSeq][ForSIDOfInputSeq]["trueStart"][outputTypeOfInputSeq][ID]
                trueEndForAfterSeq[ID] = FandS[panelIDOfInputSeq][ForSIDOfInputSeq]["trueEnd"][outputTypeOfInputSeq][ID]

                # add to after time
                timeDifference = trueEndForAfterSeq[ID] - trueStartForAfterSeq[ID]
                timeDifferenceInSecond = timeDifference.total_seconds()
                sumOfTimeForAfterSeq += timeDifferenceInSecond

                # add to after number of events
                sumOfNumberOfEventsForAfterSeq += len(inputEventSequences[ID])

    if recordAttributeName == "time":
        for ID in inputEventSequences:
            currentTrueEnd = FandS[panelIDOfInputSeq][ForSIDOfInputSeq]["trueEnd"][outputTypeOfInputSeq][ID]
            currentTrueStart = FandS[panelIDOfInputSeq][ForSIDOfInputSeq]["trueStart"][outputTypeOfInputSeq][ID]
            currentTimeDifference = currentTrueEnd - currentTrueStart
            currentTimeDifferenceInSecond = currentTimeDifference.total_seconds()

            if currentTimeDifferenceInSecond >= minValue and currentTimeDifferenceInSecond <= maxValue:
                # store output
                outputEventSequences["after"][ID] = inputEventSequences[ID]

                # update trueStart and trueEnd
                trueStartForAfterSeq[ID] = FandS[panelIDOfInputSeq][ForSIDOfInputSeq]["trueStart"][outputTypeOfInputSeq][ID]
                trueEndForAfterSeq[ID] = FandS[panelIDOfInputSeq][ForSIDOfInputSeq]["trueEnd"][outputTypeOfInputSeq][ID]

                # add to after time
                timeDifference = trueEndForAfterSeq[ID] - trueStartForAfterSeq[ID]
                timeDifferenceInSecond = timeDifference.total_seconds()
                sumOfTimeForAfterSeq += timeDifferenceInSecond

                # add to after number of events
                sumOfNumberOfEventsForAfterSeq += len(inputEventSequences[ID])

    # handling potential non-existence bug (prevent division by zero)
    if len(outputEventSequences["after"]) == 0:
        FandS[panelID][ForSID]["output"] = outputEventSequences
        FandS[panelID][ForSID]["averageTime"]["after"] = 0
        FandS[panelID][ForSID]["averageNumberOfEvents"]["after"] = 0
        FandS[panelID][ForSID]["trueStart"]["after"] = 0
        FandS[panelID][ForSID]["trueEnd"]["after"] = 0
        return

    # save to FandS
    averageTimeForAfterSeq = sumOfTimeForAfterSeq / len(outputEventSequences["after"])
    averageNumberOfEventsForAfterSeq = sumOfNumberOfEventsForAfterSeq / len(outputEventSequences["after"])

    FandS[panelID][ForSID]["output"] = outputEventSequences
    FandS[panelID][ForSID]["averageTime"]["after"] = averageTimeForAfterSeq
    FandS[panelID][ForSID]["averageNumberOfEvents"]["after"] = averageNumberOfEventsForAfterSeq
    FandS[panelID][ForSID]["trueStart"]["after"] = trueStartForAfterSeq
    FandS[panelID][ForSID]["trueEnd"]["after"] = trueEndForAfterSeq

def getNewPanelID():
    maxPanelID = -1

    if len(FandS) != 0:
        for panelID in FandS:
            if int(panelID) > maxPanelID:
                maxPanelID = int(panelID)

    return str(maxPanelID + 1)

def getNewForSID(panelID):
    max = -1

    for ForSID in FandS[panelID]:
        if int(ForSID) > max:
            max = int(ForSID)

    return str(max + 1)

def getNextForSID(panelID, currentForSID):
    for anotherForSID in FandS[panelID]:
        if anotherForSID != currentForSID:
            inputForSIDForAnotherForS = FandS[panelID][anotherForSID]["input"].split("-")[0]

            if inputForSIDForAnotherForS == currentForSID:
                return anotherForSID

    return None

def hasFilters(panelID):
    if panelID not in FandS:
        return False

    for ForSID in FandS[panelID]:
        if ForSID != "0" and FandS[panelID][ForSID]["applyToRecordAttributes"]:
            return True

    return False

def getIDListSatisfiedEventCountAndTime(panelID):
    IDListSatisfiedEventCountAndTime = []
    inputEventSequencesByID = FandS[panelID]["0"]["output"]["after"]
    timeAndEventCountFilterList = [] # return to client

    # get list of eventCount filters
    currentForSID = "0"
    allEventCountFiltersOnPanel = []
    allTimeFiltersOnPanel = []

    while currentForSID != None:
        isFilter = FandS[panelID][currentForSID]["applyToRecordAttributes"]
        isNumerical = "<=" in FandS[panelID][currentForSID]["name"]
        isEventCountFilter = False
        isTimeFilter = False

        if isFilter and isNumerical:
            splittedName = FandS[panelID][currentForSID]["name"].split("<=")
            recordAttributeName = splittedName[1]
            isEventCountFilter = (recordAttributeName == "eventCount")
            isTimeFilter = (recordAttributeName == "time")

        if isEventCountFilter and currentForSID != "0":
            filterName = FandS[panelID][currentForSID]["name"]
            splittedName = filterName.split("<=")
            minValue = float(splittedName[0])
            maxValue = float(splittedName[2])
            allEventCountFiltersOnPanel.append({ "min": minValue, "max": maxValue })

            # store eventCount filter name
            timeAndEventCountFilterList.append(FandS[panelID][currentForSID]["name"])

        if isTimeFilter:
            filterName = FandS[panelID][currentForSID]["name"]
            splittedName = filterName.split("<=")
            minValue = float(splittedName[0])
            maxValue = float(splittedName[2])
            allTimeFiltersOnPanel.append({ "min": minValue, "max": maxValue })

            # store time filter name
            if FandS[panelID][currentForSID]["displayString"] != "":
                timeAndEventCountFilterList.append(FandS[panelID][currentForSID]["displayString"])
            else:
                timeAndEventCountFilterList.append(FandS[panelID][currentForSID]["name"])

        currentForSID = getNextForSID(panelID, currentForSID)

    # simply get all ID when there are no filters
    if len(allEventCountFiltersOnPanel) == 0 and len(allTimeFiltersOnPanel) == 0:
        for ID in inputEventSequencesByID:
            IDListSatisfiedEventCountAndTime.append(ID)

    # get sequence ID that satisfies all contraints
    else:
        for ID in inputEventSequencesByID:
            satisfiedAllEventCountAndTimeFilters = True
            currentEventCount = len(inputEventSequencesByID[ID])
            currentTrueEnd = FandS[panelID]["0"]["trueEnd"]["after"][ID]
            currentTrueStart = FandS[panelID]["0"]["trueStart"]["after"][ID]
            currentTimeDifference = currentTrueEnd - currentTrueStart
            currentTimeDifferenceInSecond = currentTimeDifference.total_seconds()

            for eventCountFilter in allEventCountFiltersOnPanel:
                if currentEventCount < eventCountFilter["min"] or currentEventCount > eventCountFilter["max"]:
                    satisfiedAllEventCountAndTimeFilters = False
                    break

            for timeFilter in allTimeFiltersOnPanel:
                if currentTimeDifferenceInSecond < timeFilter["min"] or currentTimeDifferenceInSecond > timeFilter["max"]:
                    satisfiedAllEventCountAndTimeFilters = False
                    break

            if satisfiedAllEventCountAndTimeFilters:
                IDListSatisfiedEventCountAndTime.append(ID)

    return {
        "IDListSatisfiedEventCountAndTime": IDListSatisfiedEventCountAndTime,
        "timeAndEventCountFilterList": timeAndEventCountFilterList
    }

def getStartingSeqWithoutFilters(panelID, ForSID, outputType, IDListSatisfiedEventCountAndTime):
    inputEventSequences = FandS[panelID]["0"]["output"]["after"]
    inputTrueStartByID = FandS[panelID]["0"]["trueStart"]["after"]
    inputTrueEndByID = FandS[panelID]["0"]["trueEnd"]["after"]
    startingEventSequencesByID = {}
    trueStartByID = {}
    trueEndByID = {}
    allSPointsBeforeInputSPoint = []
    inputSPoint = FandS[panelID][ForSID]
    isInputSPointPattern = "orderedAVPairsForEachMatcher" in inputSPoint

    # get all SPoints before current splitting points
    currentForSID = "0"

    while currentForSID != None:
        isSplittingPoint = FandS[panelID][currentForSID]["applyToSequences"]

        if currentForSID == ForSID:
            break
        if isSplittingPoint:
            allSPointsBeforeInputSPoint.append(FandS[panelID][currentForSID])

        currentForSID = getNextForSID(panelID, currentForSID)

    # return directly if no splitting points
    if not inputSPoint["applyToSequences"]:
        for ID in IDListSatisfiedEventCountAndTime:
            startingEventSequencesByID[ID] = inputEventSequences[ID]
            trueStartByID[ID] = inputTrueStartByID[ID]
            trueEndByID[ID] = inputTrueEndByID[ID]

        return {
            "startingEventSequencesByID": startingEventSequencesByID,
            "trueStartByID": trueStartByID,
            "trueEndByID": trueEndByID
        }

    # apply all splitting points
    lastIndexOfSPointsBeforeInput = len(allSPointsBeforeInputSPoint) - 1

    for ID in IDListSatisfiedEventCountAndTime: # check only those that satisfies
        currentSequenceSatisfiesAllPreviousS = False
        currentSequenceSatisfiesInputSPoint = False
        currentIndexOfSPointsBeforeInput = 0 # update
        isCurrentSPointBeforeInputPattern = None # update
        indexOfCurrentEventMatcher = 0  # for pattern splitting points # update

        indexOfEventMatchingLastPreviousSPoint = None # for simple attribute value pair
        timeOfEventMatchingLastPreviouSPoint = None  # for simple attribute value pair
        startIndexOfEventMatchingLastPreviousSPoint = None # for pattern splitting points
        startTimeOfEventMatchingLastPreviousSPoint = None # for pattern splitting points
        endIndexOfEventMatchingLastPreviousSPoint = None # for pattern splitting points
        endTimeOfEventMatchingLastPreviousSPoint = None  # for pattern splitting points

        startIndexOfEventMatchingInputSPoint = None  # for pattern splitting points
        startTimeOfEventMatchingInputSPoint = None  # for pattern splitting points
        endIndexOfEventMatchingInputSPoint = None  # for pattern splitting points
        endTimeOfEventMatchingInputSPoint = None  # for pattern splitting points

        if len(allSPointsBeforeInputSPoint) == 0:
            timeOfEventMatchingLastPreviouSPoint = inputTrueStartByID[ID]
            indexOfEventMatchingLastPreviousSPoint = -1
            currentSequenceSatisfiesAllPreviousS = True
            isCurrentSPointBeforeInputPattern = False
        if len(allSPointsBeforeInputSPoint) != 0:
            isCurrentSPointBeforeInputPattern = "orderedAVPairsForEachMatcher" in allSPointsBeforeInputSPoint[0]

        for index, event in enumerate(inputEventSequences[ID]):
            # check if the current sequence satisfies the input splitting point (if current is a simple attribute value pair)
            if not isInputSPointPattern and currentSequenceSatisfiesAllPreviousS:
                inputSPointSplittedName = inputSPoint["name"].split("=")
                inputSPointAttributeName = inputSPointSplittedName[0]
                inputSPointAttributeValue = inputSPointSplittedName[1]
                eventAttrIndex = eventAttrNameToEventAttrIndexDict[inputSPointAttributeName]
                currentValueSetOfSelectedAttr = event[eventAttrIndex]

                # handle before
                if inputSPointAttributeValue in currentValueSetOfSelectedAttr and outputType == "before":
                    isLastPreviousSPPattern = isCurrentSPointBeforeInputPattern
                    startIndex = None
                    endIndex = index
                    startTime = None
                    endTime = datetime.strptime(event[0], "%Y-%m-%d %H:%M:%S")

                    if not isLastPreviousSPPattern:
                        startIndex = indexOfEventMatchingLastPreviousSPoint + 1
                        startTime = timeOfEventMatchingLastPreviouSPoint
                    if isLastPreviousSPPattern:
                        startIndex = endIndexOfEventMatchingLastPreviousSPoint + 1
                        startTime = endTimeOfEventMatchingLastPreviousSPoint

                    startingEventSequencesByID[ID] = inputEventSequences[ID][startIndex:endIndex]
                    trueStartByID[ID] = startTime
                    trueEndByID[ID] = endTime

                # handle after
                if inputSPointAttributeValue in currentValueSetOfSelectedAttr and outputType == "after":
                    timeOfEventMatchingInputSPoint = datetime.strptime(event[0], "%Y-%m-%d %H:%M:%S")
                    timeOfLastEvent = inputTrueEndByID[ID]
                    startingEventSequencesByID[ID] = inputEventSequences[ID][index + 1:len(inputEventSequences[ID])]
                    trueStartByID[ID] = timeOfEventMatchingInputSPoint
                    trueEndByID[ID] = timeOfLastEvent

                # should end no matter what is the output type
                if inputSPointAttributeValue in currentValueSetOfSelectedAttr:
                    currentSequenceSatisfiesInputSPoint = True
                    break

            # check if the current sequence satisfies the input splitting point (if current is a pattern)
            if isInputSPointPattern and currentSequenceSatisfiesAllPreviousS:
                orderedAVPairsForEachMatcher = inputSPoint["orderedAVPairsForEachMatcher"]
                logicTableForEachMatcher = inputSPoint["logicTableForEachMatcher"]
                currentAVPairs = orderedAVPairsForEachMatcher[indexOfCurrentEventMatcher]
                binaryIndexString = ""  # index = 0 corr to right most position

                # create binary index to logic table
                for AVPair in currentAVPairs:
                    currentAttributeName = AVPair["attributeName"]
                    currentAttributeValue = AVPair["attributeValue"]
                    currentEventAttrIndex = eventAttrNameToEventAttrIndexDict[currentAttributeName]
                    valueSetOfCurrentEventAttr = event[currentEventAttrIndex]

                    if currentAttributeValue in valueSetOfCurrentEventAttr:
                        binaryIndexString = "1" + binaryIndexString
                    else:
                        binaryIndexString = "0" + binaryIndexString

                # convert binary number index to decimal value
                decimalIndex = int(binaryIndexString, 2)

                # get match or not match from table
                currentLogicTable = logicTableForEachMatcher[indexOfCurrentEventMatcher]
                currentEventMatchesEventMatcher = currentLogicTable[decimalIndex]

                # if matched, increment indexOfCurrentEventMatcher
                if currentEventMatchesEventMatcher:
                    indexOfCurrentEventMatcher += 1

                # if is match with first matcher
                if currentEventMatchesEventMatcher and startIndexOfEventMatchingInputSPoint == None:
                    startIndexOfEventMatchingInputSPoint = index
                    startTimeOfEventMatchingInputSPoint = datetime.strptime(event[0], "%Y-%m-%d %H:%M:%S")

                # if matched with last matcher (match the whole pattern)
                if indexOfCurrentEventMatcher == len(orderedAVPairsForEachMatcher):
                    endIndexOfEventMatchingInputSPoint = index
                    endTimeOfEventMatchingInputSPoint = datetime.strptime(event[0], "%Y-%m-%d %H:%M:%S")
                    currentSequenceSatisfiesInputSPoint = True

                # handle before
                if currentSequenceSatisfiesInputSPoint and outputType == "before":
                    isLastPreviousSPPattern = isCurrentSPointBeforeInputPattern
                    startIndex = None
                    endIndex = startIndexOfEventMatchingInputSPoint
                    startTime = None
                    endTime = startTimeOfEventMatchingInputSPoint

                    if not isLastPreviousSPPattern:
                        startIndex = indexOfEventMatchingLastPreviousSPoint + 1
                        startTime = timeOfEventMatchingLastPreviouSPoint
                    if isLastPreviousSPPattern:
                        startIndex = endIndexOfEventMatchingLastPreviousSPoint + 1
                        startTime = endTimeOfEventMatchingLastPreviousSPoint

                    startingEventSequencesByID[ID] = inputEventSequences[ID][startIndex:endIndex]
                    trueStartByID[ID] = startTime
                    trueEndByID[ID] = endTime

                # handle after
                if currentSequenceSatisfiesInputSPoint and outputType == "after":
                    timeOfLastEvent = inputTrueEndByID[ID]
                    startIndex = endIndexOfEventMatchingInputSPoint + 1
                    endIndex = len(inputEventSequences[ID])
                    startTime = endTimeOfEventMatchingInputSPoint
                    endTime = timeOfLastEvent

                    startingEventSequencesByID[ID] = inputEventSequences[ID][startIndex:endIndex]
                    trueStartByID[ID] = startTime
                    trueEndByID[ID] = endTime

                # should end no matter what is the output type
                if currentSequenceSatisfiesInputSPoint:
                    break

            # check if the current sequence satisfies all splitting points (if current is a simple attribute value pair)
            if not isCurrentSPointBeforeInputPattern and not currentSequenceSatisfiesAllPreviousS and currentIndexOfSPointsBeforeInput <= lastIndexOfSPointsBeforeInput:
                currentSPointSplittedName = allSPointsBeforeInputSPoint[currentIndexOfSPointsBeforeInput]["name"].split("=")
                currentSPointAttributeName = currentSPointSplittedName[0]
                currentSPointAttributeValue = currentSPointSplittedName[1]
                eventAttrIndex = eventAttrNameToEventAttrIndexDict[currentSPointAttributeName]
                currentValueSetOfSelectedAttr = event[eventAttrIndex]

                # satisfies current splitting point
                if currentSPointAttributeValue in currentValueSetOfSelectedAttr:
                    currentIndexOfSPointsBeforeInput += 1
                    indexOfCurrentEventMatcher = 0

                    # update only if not reached the end
                    if currentIndexOfSPointsBeforeInput != len(allSPointsBeforeInputSPoint):
                        isCurrentSPointBeforeInputPattern = "orderedAVPairsForEachMatcher" in allSPointsBeforeInputSPoint[currentIndexOfSPointsBeforeInput]

                # satisfies all previous splitting point
                if currentIndexOfSPointsBeforeInput == len(allSPointsBeforeInputSPoint):
                    timeOfEventMatchingLastPreviouSPoint = datetime.strptime(event[0], "%Y-%m-%d %H:%M:%S")
                    indexOfEventMatchingLastPreviousSPoint = index
                    currentSequenceSatisfiesAllPreviousS = True

            # check if the current sequence satisfies all splitting points (if current is a pattern)
            if isCurrentSPointBeforeInputPattern and not currentSequenceSatisfiesAllPreviousS and currentIndexOfSPointsBeforeInput <= lastIndexOfSPointsBeforeInput:
                orderedAVPairsForEachMatcher = allSPointsBeforeInputSPoint[currentIndexOfSPointsBeforeInput]["orderedAVPairsForEachMatcher"]
                logicTableForEachMatcher = allSPointsBeforeInputSPoint[currentIndexOfSPointsBeforeInput]["logicTableForEachMatcher"]
                currentAVPairs = orderedAVPairsForEachMatcher[indexOfCurrentEventMatcher]
                binaryIndexString = ""  # index = 0 corr to right most position

                # create binary index to logic table
                for AVPair in currentAVPairs:
                    currentAttributeName = AVPair["attributeName"]
                    currentAttributeValue = AVPair["attributeValue"]
                    currentEventAttrIndex = eventAttrNameToEventAttrIndexDict[currentAttributeName]
                    valueSetOfCurrentEventAttr = event[currentEventAttrIndex]

                    if currentAttributeValue in valueSetOfCurrentEventAttr:
                        binaryIndexString = "1" + binaryIndexString
                    else:
                        binaryIndexString = "0" + binaryIndexString

                # convert binary number index to decimal value
                decimalIndex = int(binaryIndexString, 2)

                # get match or not match from table
                currentLogicTable = logicTableForEachMatcher[indexOfCurrentEventMatcher]
                currentEventMatchesEventMatcher = currentLogicTable[decimalIndex]

                # if matched, increment indexOfCurrentEventMatcher
                if currentEventMatchesEventMatcher:
                    indexOfCurrentEventMatcher += 1

                # if is matched with first matcher
                if currentEventMatchesEventMatcher and startIndexOfEventMatchingLastPreviousSPoint == None:
                    startIndexOfEventMatchingLastPreviousSPoint = index
                    startTimeOfEventMatchingLastPreviousSPoint = datetime.strptime(event[0], "%Y-%m-%d %H:%M:%S")

                # if matched with last matcher (matched the pattern)
                if indexOfCurrentEventMatcher == len(orderedAVPairsForEachMatcher):
                    endIndexOfEventMatchingLastPreviousSPoint = index
                    endTimeOfEventMatchingLastPreviousSPoint = datetime.strptime(event[0], "%Y-%m-%d %H:%M:%S")
                    currentIndexOfSPointsBeforeInput += 1
                    indexOfCurrentEventMatcher = 0

                    # update only if not reached the end
                    if currentIndexOfSPointsBeforeInput != len(allSPointsBeforeInputSPoint):
                        isCurrentSPointBeforeInputPattern = "orderedAVPairsForEachMatcher" in allSPointsBeforeInputSPoint[currentIndexOfSPointsBeforeInput]

                # satisfies all previous splitting point
                if currentIndexOfSPointsBeforeInput == len(allSPointsBeforeInputSPoint):
                    currentSequenceSatisfiesAllPreviousS = True

        # handle not
        if currentSequenceSatisfiesAllPreviousS and not currentSequenceSatisfiesInputSPoint and outputType == "not":
            isLastPreviousSPPattern = isCurrentSPointBeforeInputPattern
            timeOfLastEvent = inputTrueEndByID[ID]
            startIndex = None
            endIndex = len(inputEventSequences[ID])
            startTime = None
            endTime = timeOfLastEvent

            if not isLastPreviousSPPattern:
                startIndex = indexOfEventMatchingLastPreviousSPoint + 1
                startTime = timeOfEventMatchingLastPreviouSPoint
            if isLastPreviousSPPattern:
                startIndex = endIndexOfEventMatchingLastPreviousSPoint + 1
                startTime = endTimeOfEventMatchingLastPreviousSPoint

            startingEventSequencesByID[ID] = inputEventSequences[ID][startIndex:endIndex]
            trueStartByID[ID] = startTime
            trueEndByID[ID] = endTime

    return {
        "startingEventSequencesByID": startingEventSequencesByID,
        "trueStartByID": trueStartByID,
        "trueEndByID": trueEndByID
    }

def generateBinNameForNumericalAttr(minValue, binSize, attributeName, lastBinIndex, currentBinIndex):
    lowerBoundOfBin = minValue + int(currentBinIndex) * binSize
    upperBoundOfBin = lowerBoundOfBin + binSize
    isLastBin = int(currentBinIndex) == lastBinIndex
    binName = ""

    if not isLastBin:
        binName = "{0:.1f}".format(lowerBoundOfBin) + "<=" + attributeName + "<" + "{0:.1f}".format(upperBoundOfBin)
    if isLastBin:
        binName = "{0:.1f}".format(lowerBoundOfBin) + "<=" + attributeName + "<=" + "{0:.1f}".format(upperBoundOfBin)

    return binName