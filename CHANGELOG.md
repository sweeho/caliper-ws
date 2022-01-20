## 0.3.0 (March 4, 2020)

* Core changes
  * Fixed the round index bug in some rate controllers ([PR#747](https://github.com/hyperledger/caliper/pull/747)).
  * Added statistic summation option to Prometheus queries ([PR#720](https://github.com/hyperledger/caliper/pull/720)).
  * Fixed monitor bugs resulting in extra empty columns/metrics ([PR#718](https://github.com/hyperledger/caliper/pull/718)).
  * __BREAKING:__ Simplified backlog rate controller configuration ([PR#704](https://github.com/hyperledger/caliper/pull/704)).
  * Added MQTT-based communication between the master and worker processes for fully distributed operation ([PR#682](https://github.com/hyperledger/caliper/pull/682)).
  * Added Yeoman generator for the benchmark configuration and workload module files ([PR#671](https://github.com/hyperledger/caliper/pull/671)).
  * Added charting capabilities to the report generation ([PR#650](https://github.com/hyperledger/caliper/pull/650)).
  * __BREAKING:__ Configuration structure for Docker and process monitoring changed ([PR#650](https://github.com/hyperledger/caliper/pull/650)).
  * __BREAKING:__ Simplified (flattened) round settings in the benchmark configuration file, i.e., the YAML structure changed ([PR#639](https://github.com/hyperledger/caliper/pull/639)).
  
* CLI changes
  * Added new SDK bindings for Fabric ([PR#742](https://github.com/hyperledger/caliper/pull/742)).
  * __BREAKING:__ Changed the CLI commands. The binding command now accepts an external configuration file. The new launch commands can perform binding automatically ([PR#734](https://github.com/hyperledger/caliper/pull/734), [PR#742](https://github.com/hyperledger/caliper/pull/742)).
  
* Hyperledger Fabric adapter changes
  * Fixed channel initialization for the connection profiles ([PR#751](https://github.com/hyperledger/caliper/pull/751)).
  * Fixed error handling for TX broadcast errors ([PR#750](https://github.com/hyperledger/caliper/pull/750)).
  * Relaxed the network configuration schema constraints for channel peers and registrars ([PR#733](https://github.com/hyperledger/caliper/pull/733)).
  * Pass explicit Orderer objects when broadcasting a TX so the SDK won't create a new connection for each TX ([PR#731](https://github.com/hyperledger/caliper/pull/731)).
  * Added ability to pass transient data and peer targets to a gateway TXs ([PR#713](https://github.com/hyperledger/caliper/pull/713)).
  * Added experimental Fabric v2 support ([PR#703](https://github.com/hyperledger/caliper/pull/703)).

* Ethereum/Hyperledger Besu adapter changes
  * Added support for HD keys ([PR#652](https://github.com/hyperledger/caliper/pull/652)).
  * Gas estimation is now opt-in and secondary to explicit gas values. Nonces are only added if Caliper signs the TXs ([PR#640](https://github.com/hyperledger/caliper/pull/640)).
  * Allow the network configuration to specify the gas values that each method call is allotted ([PR#627](https://github.com/hyperledger/caliper/pull/627)).

* FISCO-BCOS adapter changes
  * Fixed bug for resolving certificate file paths ([PR#677](https://github.com/hyperledger/caliper/pull/677)).
  * Fixed bug related to stale response handling ([PR#647](https://github.com/hyperledger/caliper/pull/647)).

* Hyperledger Composer adapter changes
  * __BREAKING:__ The deprecated adapter has now been removed ([PR#655](https://github.com/hyperledger/caliper/pull/655)).


## 0.2.0 (October 25, 2019)

* __REMOVED:__ The Zookeeper-based distributed clients feature has been removed, and will be reimplemented in 0.3.0 ([PR#588](https://github.com/hyperledger/caliper/pull/588)).
* __DEPRECATED:__ The HL Composer adapter has been marked as deprecated and __will be removed__ in 0.3.0.
* __BREAKING:__ Added rigorous and strict validation for Fabric network configuration files. Some attributes became mutually exclusive, which might break your previous configuration files that relied on precedence between attributes ([PR#595](https://github.com/hyperledger/caliper/pull/595)).
* __BREAKING:__ Improved the logging configuration flexibility. The default log message structure has changed, which might break your dependent (e.g. log mining) applications ([PR#598](https://github.com/hyperledger/caliper/pull/595), [PR#607](https://github.com/hyperledger/caliper/pull/607)).
* __BREAKING:__ Made report file path configurable. The default report path has changed, which might break your dependent applications ([PR#601](https://github.com/hyperledger/caliper/pull/601)).
* Added support for Ethereum ([PR#432](https://github.com/hyperledger/caliper/pull/432))
* Added support for Hyperledger Besu ([PR#616](https://github.com/hyperledger/caliper/pull/616))
* Added support for FISCO BCOS ([PR#515](https://github.com/hyperledger/caliper/pull/515))
* Added the `querySmartContract` function to the `Blockchain` interface ([PR#578](https://github.com/hyperledger/caliper/pull/578)). _The old `queryState` function will be deprecated and removed in the upcoming releases (once every adapter supports the new function)!_
* Introduced observers for continuous status updates about the running benchmark ([PR#588](https://github.com/hyperledger/caliper/pull/588)).
* Added a Prometheus-based observer and monitor ([PR#588](https://github.com/hyperledger/caliper/pull/588)).
* Fixed bug that prevented using mutual TLS with the Fabric gateway mode ([PR#604](https://github.com/hyperledger/caliper/pull/604))

## 0.1.0 (September 5, 2019)
Initial release of Caliper.

## License
Hyperledger Project source code files are made available under the Apache License, Version 2.0 (Apache-2.0), located in the [LICENSE](LICENSE) file. Hyperledger Project documentation files are made available under the Creative Commons Attribution 4.0 International License (CC-BY-4.0), available at http://creativecommons.org/licenses/by/4.0/.
