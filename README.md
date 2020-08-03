# MAQUI: Interweaving Queries and Pattern Mining for Recursive Event Sequence Exploration

MAQUI is a web application that supports expressive querying and flexible pattern mining for exploring event sequence data. It is a collaborative effort between researchers at Georgia Tech and Adobe Research. For more information about the project, please refer to the paper at [IEEE VIS 2018](https://ieeexplore.ieee.org/document/8440851):

*[MAQUI: Interweaving Queries and Pattern Mining for Recursive Event Sequence Exploration](https://terrancelaw.github.io/publications/MAQUI_vast18.pdf)
[Po-Ming Law](https://terrancelaw.github.io), [Zhicheng Liu](http://www.zcliu.org), [Sana Malik](http://www.sanamalik.com), and [Rahul C. Basole](http://entsci.gatech.edu/basole/)
IEEE Transactions on Visualization and Computer Graphics ([IEEE VIS 2018](http://ieeevis.org/year/2018/welcome))*

<img src="https://s3.amazonaws.com/github-maqui/new.png"/>

## System Demo

[This video](https://youtu.be/17jqGbyWm2w) walks you through the basic funcationality of MAQUI. [This video](https://youtu.be/UhlBhDrejK0) demonstrates how MAQUI can be used for exploring the [Foursquare dataset](https://sites.google.com/site/yangdingqi/home/foursquare-dataset).

## Running the System

You need to install Python 3 (rather than Python 2), and [Flask](http://flask.pocoo.org) to run the system. Java is also needed as MAQUI uses [SPMF](http://www.philippe-fournier-viger.com/spmf/) for pattern mining. Chrome is recommended as the system was only tested with Chrome.

The following are the instructions and commands for running the system using a Mac:

Clone the repository using Terminal.

```sh
git clone https://github.com/alphagov/MAQUI.git
```

Go to the folder named `MAQUI`.

```sh
cd MAQUI
```

Create a python virtual environment, activate it, and install Flask in it.
There are different ways to do this.  For example, using `mkvenv`:

```sh
mkvenv
pip install Flask
```


Go to the [server](https://github.com/terrancelaw/MAQUI/tree/master/server) folder.

```sh
cd server
```

Start the Python server (you need Python 3 for the system to work properly).

```sh
python server.py
```

Visit http://localhost:5000/ using Chrome.

## Exploring Your Own Data

The [data folder](https://github.com/terrancelaw/MAQUI/tree/master/data) contains a smaller set of the [Foursquare dataset](https://sites.google.com/site/yangdingqi/home/foursquare-dataset). The following are the things you need to know while importing your own data into MAQUI.

MAQUI assumes that each event has multiple attributes. Attributes associated with an event are called ***event attributes***. MAQUI further assumes each event sequence to have multiple attributes. These attributes associated with an event sequence are called ***record attributes***.

For example, a patient (*male*, *38 years old*) may went through this sequence of events in his visit to an emergency department: *Arrival* -> *Triage Start* -> *Triage End* -> *Exit*. The event attribute for the first event is ***Event=Arrival***. The record attributes are ***Gender=Male***, and ***Age=38***.

While each event only has one attribute in above example, MAQUI can handle event sequence data in which an event has multiple attributes. It also works for datasets that do not contain record attributes.

Events and record attributes are stored respectively in [event.csv](https://github.com/terrancelaw/MAQUI/blob/master/data/events.csv) and [recordAttributes.csv](https://github.com/terrancelaw/MAQUI/blob/master/data/recordAttributes.csv) in the [data folder](https://github.com/terrancelaw/MAQUI/tree/master/data). For [event.csv](https://github.com/terrancelaw/MAQUI/blob/master/data/events.csv), the header should be in the format "ID,time,[a list of event attributes]". Time should be in the format "2015-05-01T00:43:28Z". For [recordAttributes.csv](https://github.com/terrancelaw/MAQUI/blob/master/data/recordAttributes.csv), the header should be "ID,[a list of record attributes]" *(if there are no record attributes, simply keep ID to be a unique list of IDs and omit the list of record attributes)*. The character "=" should not appear in any attribute values.

The current prototype should work fine for data sets that contain 100,000 to 200,000 events and a few hundreds event types for an attribute. We are working on making MAQUI more scalable:)

## Acknowledgements

This was forked from a project by [Terrance Law](https://terrancelaw.github.io).
