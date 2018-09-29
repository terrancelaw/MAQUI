from globalVariables import *
from operator import itemgetter
import helper
import csv

def load():
    loadEventSequences()
    loadRecordAttributes()

def loadEventSequences():
    global eventSequencesByID
    global eventAttrIndexToEventAttrNameDict
    global eventAttrNameToEventAttrIndexDict
    global eventAttrValueToEventAttrValueIndexDict
    global eventAttrValueIndexToEventAttrValueDict

    # read the list of events
    print("Start importing event sequences...")
    allEvents = []

    with open("../data/events.csv", "r") as f:
        reader = csv.reader(f)

        for index, event in enumerate(reader):

            # create name to index and index to name dict
            if index == 0:
                for attributeIndex, attributeName in enumerate(event):
                    if attributeIndex >= 2:  # not create for time and ID
                        eventAttrIndexToEventAttrNameDict[attributeIndex - 1] = attributeName
                        eventAttrNameToEventAttrIndexDict[attributeName] = attributeIndex - 1  # - 1 because id is not stored

            # store the events
            if index > 0:
                allEvents.append(event)

        f.close()

    # sort the events by time
    print("Sorting the events by time...")
    sortedEvents = sorted(allEvents, key=itemgetter(1))

    # get unique ID
    print("Getting unique ID list...")
    IDList = [event[0] for event in sortedEvents]
    IDList = list(set(IDList))

    # create paths: { id: [ [ time, [ attr1 ], [ attr2 ] ] ] }
    print("Storing event sequences...")

    for ID in IDList:
        eventSequencesByID[ID] = []

    allValues = {}

    for event in sortedEvents:
        ID = event[0]
        currentTime = event[1]

        # store the value index
        for i in range(2, len(event)):
            allValues[event[i]] = None

        # must append if nothing is stored
        if len(eventSequencesByID[ID]) == 0:
            array = [ currentTime ]

            for i in range(2, len(event)):
                array.append([event[i]])
            
            eventSequencesByID[ID].append(array)

        # Check if time of current event the same as previous one. If yes, append to previous.
        else:
            previousEventIndex = len(eventSequencesByID[ID]) - 1
            timeOfPreviousEvent = eventSequencesByID[ID][previousEventIndex][0]

            if currentTime == timeOfPreviousEvent:
                for i in range(2, len(event)):
                    eventSequencesByID[ID][previousEventIndex][i - 1].append(event[i])
            else:
                array = [ currentTime ]

                for i in range(2, len(event)):
                    array.append([event[i]])
                    
                eventSequencesByID[ID].append(array)

    # store value index
    for index, value in enumerate(allValues):
        eventAttrValueToEventAttrValueIndexDict[value] = str(index)
        eventAttrValueIndexToEventAttrValueDict[str(index)] = value

    print("Imported " + str(len(eventSequencesByID)) + " paths")

def loadRecordAttributes():
    global recordAttributesByID
    global recordAttrIndexToRecordAttrNameDict
    global recordAttrNameToRecordAttrIndexDict

    # import record attributes
    print("Start importing record attributes...")

    with open("../data/recordAttributes.csv", "r") as f:
        reader = csv.reader(f)

        for index, currentAttributes in enumerate(reader):

            # create name to index and index to name dict
            if index == 0:
                for attributeIndex, attributeName in enumerate(currentAttributes):
                    if attributeIndex >= 1:  # skip ID
                        recordAttrIndexToRecordAttrNameDict[attributeIndex - 1] = attributeName
                        recordAttrNameToRecordAttrIndexDict[attributeName] = attributeIndex - 1  # - 1 because id is not stored
                        recordAttrNameToNumericalOrCategoricalDict[attributeName] = "numerical"

            # store the path attribute
            if index > 0:

                for i in range(1, len(currentAttributes)):
                    ID = currentAttributes[0]

                    # store current record attribute
                    if ID not in recordAttributesByID:
                        recordAttributesByID[ID] = []
                    recordAttributesByID[ID].append(currentAttributes[i])

                    # check if current record attribute is numerical or categorical
                    attributeIndex = i - 1
                    attributeName = recordAttrIndexToRecordAttrNameDict[attributeIndex]
                    if recordAttrNameToNumericalOrCategoricalDict[attributeName] == "numerical" and not helper.isNumber(currentAttributes[i]):
                        recordAttrNameToNumericalOrCategoricalDict[attributeName] = "categorical"

        f.close()

    print("finished importing record attributes")