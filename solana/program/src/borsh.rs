//! Borsh helpers

use borsh::{maybestd::io::Error, BorshDeserialize};

/// Deserializes something and allows for incomplete reading
pub fn try_from_slice_incomplete<T: BorshDeserialize>(data: &[u8]) -> Result<T, Error> {
    let mut data_mut = data;
    let result = T::deserialize(&mut data_mut)?;
    Ok(result)
}
