//! Utility functions and types.
use anchor_lang::prelude::*;
use std::num::NonZeroUsize;

pub(crate) const fn max(a: usize, b: usize) -> usize {
    if a > b {
        a
    } else {
        b
    }
}
pub(crate) const fn round_to_next(x: usize, multiple: NonZeroUsize) -> usize {
    (x + multiple.get() - 1) / multiple.get() * multiple.get()
}

/// Constant equality implementations
pub trait ConstEq {
    /// Constant equality
    fn const_eq(&self, other: &Self) -> bool;
}
/// Constant inequality implementations
pub trait ConstNe {
    /// Constant inequality
    fn const_ne(&self, other: &Self) -> bool;
}
impl<T> ConstNe for T
where
    T: ConstEq,
{
    fn const_ne(&self, other: &Self) -> bool {
        !self.const_eq(other)
    }
}
impl<'a, T> ConstEq for &'a T
where
    T: ConstEq,
{
    fn const_eq(&self, other: &Self) -> bool {
        T::const_eq(self, other)
    }
}
impl ConstEq for u8 {
    fn const_eq(&self, other: &Self) -> bool {
        *self == *other
    }
}
impl ConstEq for Pubkey {
    fn const_eq(&self, other: &Self) -> bool {
        let own = unsafe { &*(self as *const Pubkey).cast::<[u8; 32]>() };
        let other = unsafe { &*(other as *const Pubkey).cast::<[u8; 32]>() };
        own.const_eq(other)
    }
}
impl<'a, T> ConstEq for &'a [T]
where
    T: ConstEq,
{
    fn const_eq(&self, other: &Self) -> bool {
        if self.len() != other.len() {
            return false;
        }
        let mut index = 0;
        while index < self.len() {
            if self[index].const_ne(&other[index]) {
                return false;
            }
            index += 1;
        }
        true
    }
}
impl<T, const N: usize> ConstEq for [T; N]
where
    T: ConstEq,
{
    fn const_eq(&self, other: &Self) -> bool {
        let mut index = 0;
        while index < self.len() {
            if self[index].const_ne(&other[index]) {
                return false;
            }
            index += 1;
        }
        true
    }
}