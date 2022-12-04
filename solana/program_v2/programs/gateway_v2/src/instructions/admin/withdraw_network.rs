use anchor_lang::context::CpiContext;
use anchor_lang::{error, ToAccountInfo};
use anchor_spl::token;
use anchor_spl::token::{Token, TokenAccount, Transfer};
use crate::state::{GatekeeperNetwork, Pass};
use anchor_lang::prelude::*;
use solana_program::program::invoke;
use spl_token::instruction::transfer;

pub fn withdraw_network(ctx: Context<WithdrawNetwork>, amount: u64) -> Result<()> {

    let transfer_instruction_network_result = transfer(
        &ctx.accounts.token_program.key(),
        &ctx.accounts.network_token_account.key(),
        &ctx.accounts.to_token_account.key(),
        &ctx.accounts.authority.key(),
        &[&ctx.accounts.authority.key()],
        amount,
    );
    msg!(">>>>> transfer_instruction_network_result: {:?}", transfer_instruction_network_result);
    let instruction = match transfer_instruction_network_result {
        Ok(instruction) => instruction,
        Err(error) => panic!("Transfer failed: {:?}", error),
    };


    invoke(
        &instruction,
        &[
            ctx.accounts.network_token_account.to_account_info(),
            ctx.accounts.to_token_account.to_account_info(),
            ctx.accounts.authority.to_account_info(),
            ctx.accounts.token_program.to_account_info(),
        ],
    )?;

    Ok(())
}

#[derive(Accounts)]
pub struct WithdrawNetwork<'info> {
    #[account(
        init,
        payer = authority,
        space = Pass::ON_CHAIN_SIZE,
    )]
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
