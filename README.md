# Typescript SDK for Supra

The `supra-l1-sdk` provides a convenient way to interact with the supra chain and perform operations on supra chain. It offers a set of utility functions, classes, and types to simplify the integration process and enhance developer productivity.

## Installation

Install supra-l1-sdk with npm

```bash
  npm install git+https://github.com/Entropy-Foundation/supra-l1-sdk.git
```

**NOTE:** This `sdk` utilizes [aptos-sdk](https://github.com/aptos-labs/aptos-core/tree/main/ecosystem/typescript/sdk) and expects few things such as `keyPair` of `aptos-sdk` type, so due to this you also have to add `aptos-sdk` in your project.

## Usage

Check [./src/example.ts](https://github.com/Entropy-Foundation/supra-l1-sdk/blob/master/src/example.ts) for understating about the usage.

## Functionalities

- [x] Significant `rpc_node` endpoint integration
- [x] Transaction insights
- [x] Transfer coin
- [x] Publish Package
- [X] `entry_function_payload` type tx
- [ ] `script_payload` type tx
- [ ] Sponsor transaction
- [ ] Multi-agent transaction
- [X] Starkey wallet integration support

## Contributing

If you found a bug or would like to request a feature, please file an issue. If, based on the discussion on an issue you would like to offer a code change, please make a pull request.
