mod utils;

use {
    anchor_lang::{
        prelude::*,
    }
};

declare_id!("GXD3V5AQTDrszePsSjH1yQNvfCceumZp1jM9mQR4fMPH");

const PREFIX: &str = "gateway_usage";
const DELEGATE_SEED: &str = "gateway_usage_delegate";

#[program]
pub mod usage {
    use super::*;
    use crate::utils::{spl_token_transfer, TokenTransferParams};
    
    pub fn register_usage(ctx: Context<RegisterUsage>, amount: u32, epoch: u64, bump: u8) -> ProgramResult {
        let usage = &mut ctx.accounts.usage;
        usage.dapp = *ctx.accounts.dapp.key;
        usage.gatekeeper = *ctx.accounts.gatekeeper.key;
        usage.oracle = *ctx.accounts.oracle.key;
        usage.amount = amount;
        usage.epoch = epoch;
        usage.bump = bump;
        usage.paid = false;
        Ok(())
    }
    
    pub fn draw(ctx: Context<Draw>, delegate_bump: u8) -> ProgramResult {
        let usage = &mut ctx.accounts.usage;
        let source = ctx.accounts.dapp_token_account.to_account_info();
        let destination = ctx.accounts.gatekeeper_token_account.to_account_info();
        let authority = ctx.accounts.delegate_authority.to_account_info();
        
        spl_token_transfer(TokenTransferParams {
            source,
            destination,
            authority,
            authority_signer_seeds: &[
                DELEGATE_SEED.as_bytes(),
                &usage.dapp.to_bytes(),
                &usage.oracle.to_bytes(),
                &[delegate_bump]
            ],
            token_program: ctx.accounts.token_program.to_account_info(),
            amount: usage.amount as u64,
        })?;
        
        usage.paid = true;

        Ok(())
    }
}

#[account]
#[derive(Default)]
pub struct Usage {
    pub dapp: Pubkey,
    pub gatekeeper: Pubkey,
    pub oracle: Pubkey,
    pub amount: u32,
    pub epoch: u64,
    pub bump: u8,
    pub paid: bool,
}

#[derive(Accounts)]
#[instruction(amount: u32, epoch: u64, bump: u8)]
pub struct RegisterUsage<'info> {
    #[account(
        init,
        // should match deriveUsageAccount in the client
        seeds=[
            PREFIX.as_bytes(),
            dapp.key().as_ref(),
            gatekeeper.key.as_ref(),
            oracle.key.as_ref(),
            &epoch.to_le_bytes()
        ],
        payer = oracle,
        // the msg! is a hack to help debugging. Remove once we are happy with the code
        bump={ msg!("bump = {}, epoch = {:?}", bump, epoch.to_le_bytes()); bump },
        // Space is based on the Usage struct - but for some reason it requires an extra 8 bytes to avoid a 
        // deserialisation error
        space = 32 + 32 + 32 + 4 + 8 + 8 + 1 + 1)
    ]
    usage: ProgramAccount<'info, Usage>,
    #[account(mut)]
    oracle: Signer<'info>,
    #[account()]
    dapp: AccountInfo<'info>,
    #[account()]
    gatekeeper: AccountInfo<'info>,
    system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Draw<'info> {
    #[account(
        mut,
        has_one = gatekeeper,
        constraint= !usage.paid
    )]
    usage: ProgramAccount<'info, Usage>,
    #[account(mut)]
    gatekeeper: Signer<'info>,
    #[account()]
    delegate_authority: AccountInfo<'info>,
    #[account(mut, constraint= gatekeeper_token_account.owner == &spl_token::id())]
    gatekeeper_token_account: AccountInfo<'info>,
    #[account(mut, constraint= dapp_token_account.owner == &spl_token::id())]
    dapp_token_account: AccountInfo<'info>,
    #[account(address = spl_token::id())]
    token_program: AccountInfo<'info>,
}


#[derive(Accounts)]
pub struct AddUsageAuthority<'info> {
    usage: ProgramAccount<'info, Usage>,
}

#[derive(Accounts)]
pub struct RemoveUsageAuthority<'info> {
    usage: ProgramAccount<'info, Usage>,
}

#[error]
pub enum ErrorCode {
    #[msg("Account does not have correct owner!")]
    IncorrectOwner,
    #[msg("Account is not initialized!")]
    Uninitialized,
    #[msg("Token transfer failed")]
    TokenTransferFailed,
}