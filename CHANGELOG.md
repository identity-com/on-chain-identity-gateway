# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

    PROGRAM
        src/
            instructions/
                - close_gatekeeper.rs
                - create_gatekeeper.rs
                - gatekeeper_withdraw.rs
                - set_gatekeeper_state.rs
                - update_gatekeeper.rs

            state/
                - gatekeeper.rs
                - network.rs

        tests/
            gatekeeper-suite/
                - close-gatekeeper.test.ts
                - create-gatekeeper.test.ts
                - gatekeeper-withdraw.test.ts
                - set-gatekeeper-state.test.ts
                - update-gatekeeper.test.ts
                - Test.toml
            
    - CHANGELOG.md

### Changed

    PROGRAM
        src/
            instructions/
                - mod.rs

            state/
                - mod.rs
        
        - errors.rs
        - constants.rs
        - lib.rs

    CLIENT
        src/
            lib/
                - types.ts
                - utils.ts

            - GatewayService.ts

[Unreleased]: https://github.com/identity-com/on-chain-identity-gateway