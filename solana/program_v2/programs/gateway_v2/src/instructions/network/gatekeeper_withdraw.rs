use crate::constants::GATEKEEPER_SEED;
use crate::state::Gatekeeper;
use crate::util::create_and_invoke_transfer;
use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, State, Token, TokenAccount, Transfer};

// Will withdraw funds from the gatekeeper
pub fn gatekeeper_withdraw(ctx: Context<GatekeeperWithdrawAccount>, mut amount: u64) -> Result<()> {
    // Amount 0 means withdraw all
    if amount == 0 {
        amount = ctx.accounts.gatekeeper_token_account.amount;
    }
    let authority = &mut ctx.accounts.authority;
    let gatekeeper_pda = &mut ctx.accounts.gatekeeper_pda;
    let spl_token_program = &mut ctx.accounts.spl_token_program;
    let receiver_token_account = &mut ctx.accounts.receiver_token_account;
    let gatekeeper_token_account = &mut ctx.accounts.gatekeeper_token_account;
    let mint_account = &mut ctx.accounts.mint_account;

    let bump_vector = gatekeeper_pda.bump.to_le_bytes().clone();
    let mint_of_token = mint_account.key().clone();

    let inner = vec![
        gatekeeper_token_account.to_account_info().key.as_ref(),
        receiver_token_account.to_account_info().key.as_ref(),
        mint_of_token.as_ref(),
        bump_vector.as_ref(),
    ];
    let outer = vec![inner.as_slice()];

    let transfer_instruction = Transfer {
        from: gatekeeper_token_account.to_account_info(),
        to: receiver_token_account.to_account_info(),
        authority: gatekeeper_pda.to_account_info(),
    };

    let cpi_ctx = CpiContext::new_with_signer(
        spl_token_program.to_account_info(),
        transfer_instruction,
        outer.as_slice(),
    );

    anchor_spl::token::transfer(cpi_ctx, amount)?;

    Ok(())
}

#[derive(Accounts)]
#[instruction(amount: u64)]
pub struct GatekeeperWithdrawAccount<'info> {
    pub gatekeeper: Account<'info, Gatekeeper>,
    #[account(
        mut,
        seeds=[b"state".as_ref(), gatekeeper_token_account.key().as_ref(), receiver_token_account.key.as_ref(), mint_account.key().as_ref()],
        bump = gatekeeper.bump,
        has_one = gatekeeper_token_account,
        has_one = receiver_token_account,
        has_one = mint_account,
    )]
    pub gatekeeper_pda: Account<'info, ProgramData>,
    #[account(mut)]
    pub authority: Signer<'info>,
    /// CHECK: Receiver destination account does not need to satisfy the any constraints.
    pub system_program: Program<'info, System>,
    pub spl_token_program: Program<'info, Token>,
    pub mint_account: Account<'info, Mint>,
    pub receiver_token_account: Account<'info, TokenAccount>,
    pub gatekeeper_token_account: Account<'info, TokenAccount>,
}
