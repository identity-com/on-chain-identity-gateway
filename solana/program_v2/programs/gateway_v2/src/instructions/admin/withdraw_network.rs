use crate::state::{GatekeeperNetwork};
use crate::util::create_and_invoke_transfer;
use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount};

pub fn withdraw_network(ctx: Context<WithdrawNetwork>, mut amount: u64) -> Result<()> {
    // Amount 0 means withdraw all
    if amount == 0 {
        amount = ctx.accounts.network_token_account.amount;
    }

    create_and_invoke_transfer(
        ctx.accounts.token_program.to_owned(),
        ctx.accounts.network_token_account.to_owned(),
        ctx.accounts.to_token_account.to_owned(),
        ctx.accounts.authority.to_owned(),
        &[&ctx.accounts.authority.key()],
        amount,
    )?;

    Ok(())
}

#[derive(Accounts)]
pub struct WithdrawNetwork<'info> {
    pub network: Account<'info, GatekeeperNetwork>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    #[account(mut)]
    pub network_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub to_token_account: Account<'info, TokenAccount>,
}
