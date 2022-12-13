use crate::constants::GATEKEEPER_SEED;
use crate::state::Gatekeeper;
use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount, Transfer};

// Will withdraw funds from the gatekeeper
pub fn gatekeeper_withdraw(ctx: Context<GatekeeperWithdrawAccount>, mut amount: u64) -> Result<()> {
    // Amount 0 means withdraw all
    if amount == 0 {
        amount = ctx.accounts.gatekeeper_token_account.amount;
    }
    let gatekeeper = &mut ctx.accounts.gatekeeper;
    let spl_token_program = &mut ctx.accounts.spl_token_program;
    let receiver_token_account = &mut ctx.accounts.receiver_token_account;
    let gatekeeper_token_account = &mut ctx.accounts.gatekeeper_token_account;

    let gatekeeper_authority_key = gatekeeper.authority.key();
    let gatekeeper_bump = gatekeeper.gatekeeper_bump.to_le_bytes();

    let authority_seed = &[
        GATEKEEPER_SEED.as_ref(),
        gatekeeper_authority_key.as_ref(),
        gatekeeper.gatekeeper_network.as_ref(),
        gatekeeper_bump.as_ref(),
    ][..];

    let transfer_instruction = Transfer {
        from: gatekeeper_token_account.to_account_info(),
        to: receiver_token_account.to_account_info(),
        authority: gatekeeper.to_account_info(),
    };

    let signer = &[authority_seed][..];
    let cpi_ctx = CpiContext::new_with_signer(
        spl_token_program.to_account_info(),
        transfer_instruction,
        signer,
    );

    anchor_spl::token::transfer(cpi_ctx, amount)?;

    Ok(())
}

#[derive(Accounts)]
#[instruction(amount: u64)]
pub struct GatekeeperWithdrawAccount<'info> {
    #[account(
        seeds = [GATEKEEPER_SEED, authority.key().as_ref(), gatekeeper.gatekeeper_network.key().as_ref()],
        bump = gatekeeper.gatekeeper_bump
    )]
    pub gatekeeper: Account<'info, Gatekeeper>,
    #[account()]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub spl_token_program: Program<'info, Token>,
    pub mint_account: Account<'info, Mint>,
    #[account(mut)]
    pub receiver_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub gatekeeper_token_account: Account<'info, TokenAccount>,
}
