use crate::constants::GATEKEEPER_SEED;
use crate::state::Gatekeeper;
use crate::util::create_and_invoke_transfer;
use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount, Transfer};
use std::str::FromStr;

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
    let gatekeeper_pda = &mut ctx.accounts.gatekeeper_pda;

    let gatekeeper_authority_key = gatekeeper.authority.key().clone();

    let authority_seed = &[
        GATEKEEPER_SEED.as_ref(),
        gatekeeper_authority_key.as_ref(),
        gatekeeper.gatekeeper_network.as_ref(),
    ][..];

    // Output the pda, should be the same as the gatekeeper_token_account
    let GATEWAY_PROGRAM = Pubkey::from_str("gate2TBGydKNyMNUqz64s8bz4uaWS9PNreMbmAjb1Ft").unwrap();

    let (pubkey, _) = Pubkey::find_program_address(authority_seed.clone(), &GATEWAY_PROGRAM);

    msg!("New Program address: {}", pubkey.to_string());
    msg!("PDA {}", gatekeeper_pda.key().to_string());

    let transfer_instruction = Transfer {
        from: gatekeeper_token_account.to_account_info(),
        to: receiver_token_account.to_account_info(),
        authority: gatekeeper_pda.to_account_info(),
    };

    let signer = &[authority_seed][..];

    let cpi_ctx = CpiContext::new_with_signer(
        spl_token_program.to_account_info(),
        transfer_instruction,
        signer,
    );
    msg!("Post new_with_signer");

    anchor_spl::token::transfer(cpi_ctx, amount)?;

    Ok(())
}

#[derive(Accounts)]
#[instruction(amount: u64)]
pub struct GatekeeperWithdrawAccount<'info> {
    pub gatekeeper: Account<'info, Gatekeeper>,
    #[account(mut)]
    pub authority: Signer<'info>,
    /// CHECK: PDA IS THE PDA OF THE GATEKEEPER
    pub gatekeeper_pda: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
    pub spl_token_program: Program<'info, Token>,
    pub mint_account: Account<'info, Mint>,
    pub receiver_token_account: Account<'info, TokenAccount>,
    pub gatekeeper_token_account: Account<'info, TokenAccount>,
}
