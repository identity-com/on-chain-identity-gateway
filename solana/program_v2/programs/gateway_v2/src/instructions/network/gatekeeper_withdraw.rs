use crate::constants::GATEKEEPER_SEED;
use crate::state::Gatekeeper;
use crate::util::create_and_invoke_transfer;
use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount};

// Will withdraw funds from the gatekeeper
pub fn gatekeeper_withdraw(ctx: Context<GatekeeperWithdrawAccount>, mut amount: u64) -> Result<()> {
    // Amount 0 means withdraw all
    if amount == 0 {
        amount = ctx.accounts.gatekeeper_token_account.amount;
    }
    let authority = &mut ctx.accounts.authority;
    let gatekeeper = &mut ctx.accounts.gatekeeper;
    let spl_token_program = &mut ctx.accounts.spl_token_program;
    let receiver_token_account = &mut ctx.accounts.receiver_token_account;
    let gatekeeper_token_account = &mut ctx.accounts.gatekeeper_token_account;

    create_and_invoke_transfer(
        spl_token_program.to_owned(),
        receiver_token_account.to_owned(),
        gatekeeper_token_account.to_owned(),
        authority.to_owned(),
        &[&authority.key()],
        amount,
    )?;

    Ok(())
}

#[derive(Accounts)]
#[instruction()]
pub struct GatekeeperWithdrawAccount<'info> {
    pub gatekeeper: Account<'info, Gatekeeper>,
    #[account(mut)]
    pub authority: Signer<'info>,
    /// CHECK: Receiver destination account does not need to satisfy the any constraints.
    pub system_program: Program<'info, System>,
    pub spl_token_program: Program<'info, Token>,
    pub receiver_token_account: Account<'info, TokenAccount>,
    pub gatekeeper_token_account: Account<'info, TokenAccount>,
}
