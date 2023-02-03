use anchor_lang::prelude::*;

/// [UpdateOperands] contains and owns all the operands required to perform an update operation.
/// Its purpose is to provide a named return type for the [UpdateOperations::operands] method.
///
/// The `receiving_container` will have matched `remove_keys` taken out of it, while
/// `added_containers` will be appended. The actual implementation of the transfer
/// can be found in [UpdateOperations::apply_update].
pub struct UpdateOperands<'a, Container> {
    receiving_container: &'a mut Vec<Container>,
    remove_keys: Vec<Pubkey>,
    added_containers: Vec<Container>,
}

impl<'a, Container> UpdateOperands<'a, Container> {
    pub fn new(
        receiving_container: &'a mut Vec<Container>,
        remove_keys: Vec<Pubkey>,
        added_containers: Vec<Container>,
    ) -> UpdateOperands<'a, Container> {
        UpdateOperands {
            receiving_container,
            remove_keys,
            added_containers,
        }
    }
}

/// [UpdateOperations] provides functionality to apply state updates to the [crate::state::Gatekeeper]
/// and [crate::state::GatekeeperNetwork] structs. A single [UpdateOperations::apply_update] method
/// will be exposed after implementing this trait.
///
/// The generic types are used as follows:
///
/// * `Operation` - The type of the struct containing the add and remove fields. For example: [crate::UpdateGatekeeperKeys]
/// * `Container` - The type being added during the update operation. For example: [crate::state::GatekeeperAuthKey]
pub trait UpdateOperations<Operation, Container> {
    fn apply_update(&mut self, operation: Operation, authority: &Signer) -> Result<()> {
        let UpdateOperands {
            receiving_container,
            remove_keys,
            added_containers,
        } = Self::operands(self, operation);

        for remove_key in &remove_keys {
            let index = receiving_container
                .iter()
                .position(|x| Self::extract_key(x) == *remove_key);

            if let Some(index) = index {
                Self::pre_remove_validation(remove_key, authority)?;
                receiving_container.remove(index);
            } else {
                Err(Self::missing_key_error())?;
            }
        }

        for added_container in added_containers {
            let index = receiving_container
                .iter()
                .position(|x| Self::extract_key(x) == Self::extract_key(&added_container));

            if let Some(index) = index {
                Self::pre_add_validation(&added_container, authority)?;
                receiving_container[index] = added_container;
            } else {
                receiving_container.push(added_container);
            }
        }

        Ok(())
    }

    /// Helper function to partition which members of struct implementing this trait
    /// are to receive mutations. Documentation on the return type can be found in [UpdateOperands].
    fn operands(this: &mut Self, operation: Operation) -> UpdateOperands<Container>;

    /// Helper function to extract a [Pubkey] type from a [Container] type.
    fn extract_key(container: &Container) -> Pubkey;

    /// If a [Pubkey] that was requested to be removed is not present, an [Error]
    /// will be returned. This function allows one ot specify the error code to be returned.
    fn missing_key_error() -> Error;

    /// Before a [Pubkey] is removed, the opportunity to perform validations is given.
    /// Returning an [Ok] result indicates all validations passed.
    fn pre_remove_validation(key: &Pubkey, authority: &Signer) -> Result<()>;

    /// Before a [Container] is added, the opportunity to perform validations is given.
    /// Returning an [Ok] result indicates all validations passed.
    fn pre_add_validation(container: &Container, authority: &Signer) -> Result<()>;
}
