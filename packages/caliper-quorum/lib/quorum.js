/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

const EthereumHDKey = require('ethereumjs-wallet/hdkey');
const Web3 = require('web3');
const {
    BlockchainInterface,
    CaliperUtils,
    ConfigUtil,
    TxStatus
} = require('@hyperledger/caliper-core');
const logger = CaliperUtils.getLogger('quorum.js');

/**
 * @typedef {Object} EthereumInvoke
 *
 * @property {string} verb Required. The name of the smart contract function
 * @property {string} args Required. Arguments of the smart contract function in the order in which they are defined
 * @property {boolean} isView Optional. If method to call is a view.
 */

/**
 * Implements {BlockchainInterface} for a web3 Quorum backend.
 */
class Quorum extends BlockchainInterface {
    /**
     * Create a new instance of the {Quorum} class.
     * @param {number} workerIndex The zero-based index of the worker who wants to create an adapter instance. -1 for the master process.
     */
    constructor(workerIndex) {
        super();
        let configPath = CaliperUtils.resolvePath(
            ConfigUtil.get(ConfigUtil.keys.NetworkConfig)
        );
        this.bcType = 'quorum';
        this.quorumConfig = require(configPath).quorum;
        this.clientIndex = workerIndex;
        this.fromAddress = "";
        this.fromAddressPassword = "";
        this.privateFrom = "";

        // If Master or Worker1, use first node in networkConfig nodes array
        if (this.clientIndex == -1 || workerIndex == 0) {
            this.web3 = new Web3(
                new Web3.providers.WebsocketProvider(this.quorumConfig.nodes[0].url)
            );
            this.fromAddress = this.quorumConfig.nodes[0].fromAddress;
            this.fromAddressPassword = this.quorumConfig.nodes[0].fromAddressPassword;
            this.privateFrom = this.quorumConfig.nodes[0].privateFrom;
        }
        else {
            this.web3 = new Web3(
                new Web3.providers.WebsocketProvider(this.quorumConfig.nodes[this.clientIndex].url)
            );
            this.fromAddress = this.quorumConfig.nodes[this.clientIndex].fromAddress;
            this.fromAddressPassword = this.quorumConfig.nodes[this.clientIndex].fromAddressPassword;
            this.privateFrom = this.quorumConfig.nodes[this.clientIndex].privateFrom;
        }
        this.web3.transactionConfirmationBlocks = this.quorumConfig.transactionConfirmationBlocks;
    }

    /**
     * Retrieve the blockchain type the implementation relates to
     * @returns {string} the blockchain type
     */
    getType() {
        return this.bcType;
    }

    /**
     * Initialize the {Quorum} object.
     * @param {boolean} workerInit Indicates whether the initialization happens in the worker process.
     * @return {object} Promise<boolean> True if the account got unlocked successful otherwise false.
     */
    init(workerInit) {
        if (this.quorumConfig.contractDeployerAddressPrivateKey) {
            this.web3.eth.accounts.wallet.add(
                this.quorumConfig.contractDeployerAddressPrivateKey
            );
        } else if (this.quorumConfig.contractDeployerAddressPassword) {
            return this.web3.eth.personal.unlockAccount(
                this.quorumConfig.contractDeployerAddress,
                this.quorumConfig.contractDeployerAddressPassword,
                1000
            );
        }
    }

    /**
     * Deploy smart contracts specified in the network configuration file.
     * @return {object} Promise execution for all the contract creations.
     */
    async installSmartContract() {
        let promises = [];
        let self = this;
        logger.info('Creating contracts...');
        for (const key of Object.keys(this.quorumConfig.contracts)) {
            let contractData = require(CaliperUtils.resolvePath(
                this.quorumConfig.contracts[key].path
            )); // TODO remove path property

            let contractGas = contractData.gas;
            let estimateGas = this.quorumConfig.contracts[key].estimateGas;
            let isPrivate = this.quorumConfig.contracts[key].isPrivate;
            let privateFor = this.quorumConfig.contracts[key].privateFor;
            let privateFrom = this.privateFrom;

            this.quorumConfig.contracts[key].abi = contractData.abi;
            promises.push(
                new Promise(async function(resolve, reject) {
                    let contractInstance = null;
                    let status = 'PUBLIC';
                    try {
                        if (isPrivate) {
                            contractInstance = await self.deployPrivateContract(
                                contractData,
                                privateFrom,
                                privateFor
                            );
                            status = 'PRIVATE';
                        } else {
                            contractInstance = await self.deployContract(
                                contractData
                            );
                        }
                        logger.info(
                            'Deployed contract ' +
                                contractData.name +
                                ' at ' +
                                contractInstance.options.address +
                                ', status: ' +
                                status
                        );
                        self.quorumConfig.contracts[key].address =
                            contractInstance.options.address;
                        self.quorumConfig.contracts[key].gas = contractGas;
                        self.quorumConfig.contracts[
                            key
                        ].estimateGas = estimateGas;
                        resolve(contractInstance);
                    } catch (error) {
                        logger.error(error);
                        reject(error);
                    }
                })
            );
        }
        return Promise.all(promises);
    }

    /**
     * Return the Ethereum context associated with the given callback module name.
     * @param {string} name The name of the callback module as defined in the configuration files.
     * @param {object} args Unused.
     * @return {object} The assembled Ethereum context.
     * @async
     */
    async getContext(name, args) {
        let context = {
            clientIndex: this.clientIndex,
            contracts: {},
            nonces: {},
            web3: this.web3
        };

        for (const key of Object.keys(args.contracts)) {
            context.contracts[key] = {
                contract: new this.web3.eth.Contract(
                    args.contracts[key].abi,
                    args.contracts[key].address,
                    {
                        from: this.fromAddress,
                        gasPrice: '0'
                    }
                ),
                gas: args.contracts[key].gas,
                estimateGas: args.contracts[key].estimateGas,
                //Quorum specific
                isPrivate: args.contracts[key].isPrivate,
                privateFor: args.contracts[key].privateFor
            };
        }
        if (this.fromAddress) {
            context.fromAddress = this.fromAddress;
        }

        //Quorum specific
        if (this.fromAddressPassword) {
            await context.web3.eth.personal.unlockAccount(
                this.fromAddress,
                this.fromAddressPassword,
                1000
            );
        }
        return context;
    }

    /**
     * Release the given Ethereum context.
     * @param {object} context The Ethereum context to release.
     * @async
     */
    async releaseContext(context) {
        // nothing to do
    }

    /**
     * Invoke a smart contract.
     * @param {Object} context Context object.
     * @param {String} contractID Identity of the contract.
     * @param {String} contractVer Version of the contract.
     * @param {EthereumInvoke|EthereumInvoke[]} invokeData Smart contract methods calls.
     * @param {Number} timeout Request timeout, in seconds.
     * @return {Promise<object>} The promise for the result of the execution.
     */
    async invokeSmartContract(
        context,
        contractID,
        contractVer,
        invokeData,
        timeout
    ) {
        let invocations;
        if (!Array.isArray(invokeData)) {
            invocations = [invokeData];
        } else {
            invocations = invokeData;
        }

        let promises = [];
        invocations.forEach((item, index) => {
            promises.push(
                this.sendTransaction(
                    context,
                    contractID,
                    contractVer,
                    item,
                    timeout
                )
            );
        });
        return Promise.all(promises);
    }

    /**
     * Query a smart contract.
     * @param {Object} context Context object.
     * @param {String} contractID Identity of the contract.
     * @param {String} contractVer Version of the contract.
     * @param {EthereumInvoke|EthereumInvoke[]} invokeData Smart contract methods calls.
     * @param {Number} timeout Request timeout, in seconds.
     * @return {Promise<object>} The promise for the result of the execution.
     */
    async querySmartContract(
        context,
        contractID,
        contractVer,
        invokeData,
        timeout
    ) {
        let invocations;
        if (!Array.isArray(invokeData)) {
            invocations = [invokeData];
        } else {
            invocations = invokeData;
        }
        let promises = [];
        invocations.forEach((item, index) => {
            item.isView = true;
            promises.push(
                this.sendTransaction(
                    context,
                    contractID,
                    contractVer,
                    item,
                    timeout
                )
            );
        });
        return Promise.all(promises);
    }

    /**
     * Submit a transaction to the ethereum context.
     * @param {Object} context Context object.
     * @param {String} contractID Identity of the contract.
     * @param {String} contractVer Version of the contract.
     * @param {EthereumInvoke} methodCall Methods call data.
     * @param {Number} timeout Request timeout, in seconds.
     * @return {Promise<TxStatus>} Result and stats of the transaction invocation.
     */
    async sendTransaction(
        context,
        contractID,
        contractVer,
        methodCall,
        timeout
    ) {
        let status = new TxStatus();
        let params = { from: context.fromAddress };
        let contractInfo = context.contracts[contractID];

        try {
            context.engine.submitCallback(1); //increment callback counter
            let receipt = null;
            let methodType = 'send';
            if (methodCall.isView) {
                methodType = 'call';
            } else if (
                context.nonces &&
                typeof context.nonces[context.fromAddress] !== 'undefined'
            ) {
                let nonce = context.nonces[context.fromAddress];
                context.nonces[context.fromAddress] = nonce + 1;
                params.nonce = nonce;
            }
            // Setting Quorum isPrivate and privateFor parameters
            if (methodCall.isPrivate) {
                params.isPrivate = methodCall.isPrivate;
                params.privateFor = methodCall.privateFor;
            }
            if (methodCall.args) {
                if (contractInfo.gas && contractInfo.gas[methodCall.verb]) {
                    params.gas = contractInfo.gas[methodCall.verb];
                } else if (contractInfo.estimateGas) {
                    params.gas = 1000 + await contractInfo.contract.methods[methodCall.verb](...methodCall.args).estimateGas();
                }
                receipt = await contractInfo.contract.methods[methodCall.verb](...methodCall.args)[methodType](params);
            } else {
                if (contractInfo.gas && contractInfo.gas[methodCall.verb]) {
                    params.gas = contractInfo.gas[methodCall.verb];
                } else if (contractInfo.estimateGas) {
                    params.gas = 1000 + await contractInfo.contract.methods[methodCall.verb].estimateGas(params);
                }
                receipt = await contractInfo.contract.methods[methodCall.verb]()[methodType](params);
            }
            status.SetID(receipt.transactionHash);
            status.SetResult(receipt);
            status.SetVerification(true);
            status.SetStatusSuccess();
        } catch (err) {
            status.SetStatusFail();
            logger.error(
                'Failed tx on ' +
                    contractID +
                    ' calling method ' +
                    methodCall.verb +
                    ' From ' +
                    params.from +
                    ' ARGS: ' +
                    methodCall.args
            );
            logger.error(err);
        }
        return Promise.resolve(status);
    }

    /**
     * Query the given smart contract according to the specified options.
     * @param {object} context The Quorum context returned by {getContext}.
     * @param {string} contractID The name of the contract.
     * @param {string} contractVer The version of the contract.
     * @param {string} key The argument to pass to the smart contract query.
     * @param {string} [fcn=query] The contract query function name.
     * @return {Promise<object>} The promise for the result of the execution.
     */
    async queryState(context, contractID, contractVer, key, fcn = 'query') {
        let methodCall = {
            verb: fcn,
            args: [key],
            isView: true
        };
        return this.sendTransaction(
            context,
            contractID,
            contractVer,
            methodCall,
            60
        );
    }

    /**
     * Deploys a new contract using the given web3 instance
     * @param {JSON} contractData Contract data with abi, bytecode and gas properties
     * @returns {Promise<web3.eth.Contract>} The deployed contract instance
     */
    deployContract(contractData) {
        let web3 = this.web3;
        let contractDeployerAddress = this.quorumConfig.contractDeployerAddress;
        return new Promise(function(resolve, reject) {
            let contract = new web3.eth.Contract(contractData.abi);
            let contractDeploy = contract.deploy({
                data: contractData.bytecode
            });
            contractDeploy
                .send({
                    from: contractDeployerAddress,
                    gas: contractData.gas,
                    gasPrice: '0'
                })
                .on('error', error => {
                    reject(error);
                })
                .then(newContractInstance => {
                    resolve(newContractInstance);
                });
        });
    }

    /**
     * Deploys a new Private contract using the given web3 instance
     * @param {JSON} contractData Contract data with abi, bytecode and gas properties
     * @param {JSON} privateFrom Tessera pub key
     * @param {JSON} privateFor array of Tessera pub keys
     * @returns {Promise<web3.eth.Contract>} The deployed private contract instance
     */
    deployPrivateContract(contractData, privateFrom, privateFor) {
        let web3 = this.web3;
        let contractDeployerAddress = this.quorumConfig.contractDeployerAddress;
        return new Promise(function(resolve, reject) {
            let contract = new web3.eth.Contract(contractData.abi);
            let contractDeploy = contract.deploy({
                data: contractData.bytecode
            });
            contractDeploy
                .send({
                    from: contractDeployerAddress,
                    gas: contractData.gas,
                    gasPrice: '0',
                    privateFrom: privateFrom,
                    privateFor: privateFor
                })
                .on('error', error => {
                    reject(error);
                })
                .then(newContractInstance => {
                    resolve(newContractInstance);
                });
        });
    }

    /**
     * It passes deployed contracts addresses to all clients (only known after deploy contract)
     * @param {Number} number of clients to prepare
     * @returns {Array} client args
     * @async
     */
    async prepareWorkerArguments(number) {
        let result = [];
        for (let i = 0; i < number; i++) {
            result[i] = { contracts: this.quorumConfig.contracts };
        }
        return result;
    }
}

module.exports = Quorum;
