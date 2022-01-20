
#!/bin/bash

#### Configuration options #############################################

# Host ports
rpc_start_port=23000
node_start_port=24000
raft_start_port=25000
ws_start_port=26000
tessera_start_port=27000

# Default port number
raft_port=50400
tessera_port=9000
rlp_port=30303
rpc_port=8545
ws_port=8546

# VIP Subnet
subnet="172.13.0.0/16"

# Total nodes to deploy
total_nodes=5

# Signer nodes for Clique and IBFT
signer_nodes=5

# Consensus engine ex. raft, clique, istanbul
consensus=raft

# Block period for Clique and IBFT
block_period=0

# Docker image name
image=quorum-raft-ibft

# Service name for docker-compose.yml
service=n1

# Send some ether for pre-defined accounts
alloc_ether=true

#Create deterministic accounts for testing purpose
fixed_accounts=true

node_name_prefix=master
auto_start_containers=true

########################################################################

[[ "$total_nodes" -lt "$signer_nodes" ]] && total_nodes=$signer_nodes