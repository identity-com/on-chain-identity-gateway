use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

// #[program]
pub mod program_v_two {
    use super::*;
    pub fn initialize() -> String {
        String::from("initialize")
    }
}

#[derive(Accounts)]
pub struct Initialize {}
