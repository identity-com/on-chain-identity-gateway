use anchor_lang::prelude::*;
pub mod program_files;
pub mod types;
pub mod util;
declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod anchor_gateway {
    use super::*;

    pub fn set_data(ctx: Context<SetData>, data: Data) -> Result<()> {
        ctx.accounts.my_account.data = data.data;
        ctx.accounts.my_account.age = data.age;
        Ok(())
    }

    pub fn initialize(_ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }
}

#[account]
#[derive(Default)]
pub struct MyAccount {
    pub data: u64,
    pub age: u8
}

#[derive(AnchorSerialize, AnchorDeserialize, Eq, PartialEq, Clone, Copy, Debug)]
pub struct Data {
    pub data: u64,
    pub age: u8
}
#[derive(Accounts)]
pub struct SetData<'info> {
    #[account(mut)]
    pub my_account: Account<'info, MyAccount>
}
#[derive(Accounts)]
pub struct Initialize {}


