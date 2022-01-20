### Steps to Deploy and Use Caliper with Custum Quorum SUT

Full documentation here: https://hyperledger.github.io/caliper/v0.3.2/getting-started/

This guide is meant to guide you through and get started quickly, modifying the Caliper to support Quorum SUT.

We are installing in GCP and GKE K8s cluster. Tweak required if not on GCP/GKE.

## Deploy MQTT Broker
In local terminal with kubectl, use Helm to install the MQTT Broker to your kubernetes cluster required for communication between Caliper master and worker.

```
cd ~/git/
git clone https://github.com/sweeho/caliper-ws.git
```
Use a Cloud CLI to reserve an the IP. e.g.
```
gcloud compute addresses create quorum-1-internal-lb --region asia-southeast1 --subnet default --addresses=10.148.0.13
```

Update the LoadbalacerIP in ~/git/caliper-ws/eclipse-mosquitto/templates/service.yaml. Note down this IP for next step to be updated in the Caliper master and worker.

Helm install the mqtt broker.
```
helm install mqtt eclipse-mosquitto/ -f ./eclipse-mosquitto/values-dev.yaml 
```

## Hyperledger Caliper Master Installation on a Google Cloud VM

Launch a GCP VM. SSH into the VM.

Install the following pre requisite into the VM.

```
sudo apt update
sudo apt install git
sudo apt install nodejs npm
sudo apt install build-essential
curl -sL https://raw.githubusercontent.com/nvm-sh/nvm/v0.34.0/install.sh -o install_nvm.sh
bash install_nvm.sh
nvm ls-remote
nvm install 10.16.2
nvm use 10.16.2
npm -v # we tested on 6.9.0
node -v # we tested on v10.16.2
```

Compile Caliper to support Quorum SUT and web socket
```
cd ~/git/
git clone https://github.com/sweeho/caliper-ws.git
cd ~/git/caliper-ws/
npm i && npm run repoclean -- --yes && npm run bootstrap
```


## Deploy Caliper Workers node K8s pod 
In local terminal with kubectl,

```
cd ~/git/
git clone https://github.com/sweeho/caliper-ws.git
cd ~/git/caliper-ws/
```

Update the mqtt broker address in ~/git/caliper-ws/caliper-worker/profiles/default/caliper.yaml

Use Helm to install the Caliper worker to your kubernetes cluster.
```
cd ~/git/caliper-ws/
k config use-context CONTEXT_NAME
helm install caliper caliper-worker/
```

Check the Caliper workers logs to ensure it can connect to the mqtt broker.


## Run Caliper Master

In local terminal
```
cd ~/git/caliper-ws/
```
Update the mqtt broker address: 
- ~/git/caliper-ws/profiles/default/caliper.yaml

Update the quorum node details:
- ~/git/caliper-ws/profiles/default/networkconfig-1n.json
- ~/git/caliper-ws/profiles/default/networkconfig-4n.json

Send transaction through single calier worker connected to a single Quorum node websocket port 8546
```
node ~/git/caliper-ws/packages/caliper-cli/caliper.js launch master --caliper-workspace ~/git/quorum-caliper-benchmarks/partior/4NodesWS/profiles/default/ --caliper-benchconfig benchconfig-1n.yaml --caliper-networkconfig networkconfig-1n.json --caliper-flow-skip-end 
```

Send transaction through 4 calier workers connected to 4 seperate Quorum nodes websocket port 8546
```
node ~/git/caliper-ws/packages/caliper-cli/caliper.js launch master --caliper-workspace ~/git/quorum-caliper-benchmarks/partior/4NodesWS/profiles/default/ --caliper-benchconfig benchconfig-4n.yaml --caliper-networkconfig networkconfig-4n.json --caliper-flow-skip-end 
```