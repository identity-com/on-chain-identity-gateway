//! Borsh helpers

use borsh::{
    maybestd::io::{Error, Write},
    BorshDeserialize, BorshSerialize,
};

/// Deserializes something and allows for incomplete reading
pub fn try_from_slice_incomplete<T: BorshDeserialize>(data: &[u8]) -> Result<T, Error> {
    let mut data_mut = data;
    let result = T::deserialize(&mut data_mut)?;
    Ok(result)
}

/// Helper struct to count how much data would be written during serialization
/// TODO remove after this is released in solana_program
#[derive(Default)]
struct WriteCounter {
    count: usize,
}

impl Write for WriteCounter {
    fn write(&mut self, data: &[u8]) -> Result<usize, Error> {
        let amount = data.len();
        self.count += amount;
        Ok(amount)
    }

    fn flush(&mut self) -> Result<(), Error> {
        Ok(())
    }
}

/// Get the packed length for the serialized form of this object instance.
///
/// Useful when working with instances of types that contain a variable-length
/// sequence, such as a Vec or HashMap.  Since it is impossible to know the packed
/// length only from the type's schema, this can be used when an instance already
/// exists, to figure out how much space to allocate in an account.
pub fn get_instance_packed_len<T: BorshSerialize>(instance: &T) -> Result<usize, Error> {
    let mut counter = WriteCounter::default();
    instance.serialize(&mut counter)?;
    Ok(counter.count)
}
