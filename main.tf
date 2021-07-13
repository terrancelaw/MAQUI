// Configure environment variables, specify default variable and type
variable "gcp_credentials_path" {
 type = string
}

variable "username" {
 type = string
}

variable "project" {
 type = string
}

// Configure the Google Cloud provider
provider "google" {
 credentials = file(var.gcp_credentials_path)
 project     = "${var.project}"
 region      = "europe-west2"
}

// Terraform plugin for creating random ids
resource "random_id" "instance_id" {
 byte_length = 8
}

// A single Compute Engine instance
resource "google_compute_instance" "default" {
 name         = "flask-vm-${random_id.instance_id.hex}"
 machine_type = "f1-micro"
 zone         = "europe-west2-b"
 // Add SSH access to the Compute Engine Instance from instance creator
 // Enable guest attributes
 // Users will need a role with `compute.instances.getGuestAttributes` permission; use GCP IAM to grant
 metadata = {
    ssh-keys = "${var.username}:${file("~/.ssh/id_rsa.pub")}"
    enable-guest-attributes = "TRUE"
  }

 boot_disk {
   initialize_params {
     image = "debian-cloud/debian-9"
   }
 }

// Make sure flask is installed on all new instances for later steps
// Also add git so we can git clone alphagov/MAQUI
// MAQUI requires python3 to run properly, so we install pip3 and pip3 install flask
// MAQUI also needs java, hence default-jre
 metadata_startup_script = "sudo apt-get update; sudo apt-get install -yq build-essential python-pip rsync; pip install flask; sudo apt-get install git --yes; git clone https://github.com/alphagov/MAQUI.git; sudo apt install python3-pip --yes; sudo pip3 install flask; sudo apt install default-jre --yes"

 network_interface {
   network = "default"

   access_config {
     // Include this section to give the VM an external ip address
   }
 }
}

// A variable for extracting the external IP address of the instance
 output "ip" {
  value = google_compute_instance.default.network_interface.0.access_config.0.nat_ip
}

resource "google_compute_firewall" "default" {
 name    = "flask-app-firewall"
 network = "default"

 allow {
   protocol = "tcp"
   ports    = ["5000"]
 }
}
