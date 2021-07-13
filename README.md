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

## Running MAQUI on a Flask server using Terraform on Google Cloud Platform

Some of our colleagues aren't on developer laptops so couldn't make use of MAQUI. 
We can use the cloud to provide a Software as a Service solution (SaaS). 
We build a MVP using Terraform's Hashicorp Configuration Language (HCL) so that we can capture our infrastructure as code (IaS).   
 
We followed [this documentation](https://cloud.google.com/community/tutorials/getting-started-on-gcp-with-terraform) to get started.
 We installed [terraform](https://learn.hashicorp.com/tutorials/terraform/install-cli) and created a new service account key with a role that has
  Compute Admin permissions.
   We created a configuration file called `main.tf`, read the comments in this file for what each bit does. 
   We also had to change the region and zone and used this [tool](https://cloud.google.com/compute/docs/regions-zones) to help with that. 
   We tweaked a few other things such as firewall rules and enabling guest attributes. 
   
There's a file called `terraform.tfvars.example` that demonstrates how terraform makes use of variables. Change the filename to just `terraform.tfvars`
 and provide the correct variable information (i.e. key locations, project name and your machine's username). 
 You'll need a GCP service account json access key with appropriate permissions (as described above) in the `.secrets` folder (create the folder in the root directory). 
 You'll need your RSA public key in `~/.ssh/id_rsa.pub` (enter your machine's username to your newly created `terraform.tfvars` file).  
 
 If you get stuck try consulting Google's or Hashicorp's docs which are comprehensive.

### Using Terraform for the first time
After installing terraform, you should run:

`terraform init` to download relevant plugins.  

`terraform plan`   

`terraform apply` to launch the plan, followed by 'yes' to create instance.  

You can then create a [simple 'Hello World' Flask app](https://flask.palletsprojects.com/en/2.0.x/quickstart/) to check everything works
 (go to the [GCP VM instances page](https://console.cloud.google.com/compute/instances) to find your instance,
  SSH in and deploy the app following the instructions, you'll need another shell to check the Flask app is working).  

When you're done use `terraform destroy` to remove all resources defined during configuration. 

### Using Terraform to build and configure instance for MAQUI flask app 

You have everything on the instance you need to run MAQUI. The git clone step of the MAQUI repo might have failed,
 rerun it (i.e. ensure alphagov/MAQUI repo is on the instance `git clone https://github.com/alphagov/MAQUI.git`). 
 
 You'll need the data you want to explore in the `data` folder,
  you can [transfer files using SSH in the browser](https://cloud.google.com/compute/docs/instances/transfer-files#transferbrowser).
   You'll need both `events.csv` and `recordAttributes.csv` in there.  
   
   You are now ready to start the app. Go to the `server` folder 
and run `python3 server.py` to start the flask app for MAQUI. This points to port 5000. 

### Connect to the app from your own machine so that you can use it's sofware (i.e. Chrome)  
With the instance created and the flask app running, we can use [port forwarding](https://cloud.google.com/solutions/connecting-securely#port-forwarding-over-ssh)
 to connect to it through ssh on our local machine. We can use the [Google Command Line interface / SDK](https://cloud.google.com/sdk/docs/downloads-interactive) to ssh to the instance. 
 With that installed on our local machine we can run the `port_forwarding_example` script in the command line but ensuring we have the correct Virtual Machine name.
 
 We specify a local port of '2222' and a remote port of '5000' (Flask's default), and you open [localhost:2222/]() in your Chrome browser,
  the HTTP connection uses the SSH tunnel that you created to your remote host to connect to the specified VM instance using SSH.
   The HTTP connection will then use the SSH tunnel to connect to port 5000 on the same machine, but over an encrypted,
    secure SSH connection. 
    
## Acknowledgements

This was forked from a project by [Terrance Law](https://terrancelaw.github.io).
