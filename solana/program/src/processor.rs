//! Program state processor

use {
    crate::{
        id,
        instruction::GatewayInstruction,
        state::{get_gateway_token_address_with_seed, GATEWAY_TOKEN_ADDRESS_SEED, Gatekeeper},
    },
    borsh::{BorshDeserialize, BorshSerialize},
    solana_program::{
        account_info::{next_account_info, AccountInfo},
        entrypoint::ProgramResult,
        msg,
        program::invoke_signed,
        program_error::ProgramError,
        pubkey::Pubkey,
        rent::Rent,
        system_instruction,
        sysvar::Sysvar,
    },
    solana_gateway::{
        state::GatewayToken,
        borsh::{try_from_slice_incomplete, get_instance_packed_len}
    }
};

/// Instruction processor
pub fn process_instruction(
    _program_id: &Pubkey,
    accounts: &[AccountInfo],
    input: &[u8],
) -> ProgramResult {
    let instruction = GatewayInstruction::try_from_slice(input)?;

    match instruction {
        GatewayInstruction::IssueVanilla { seed  } => issue_vanilla(accounts, &seed)
    }
}

fn issue_vanilla(accounts: &[AccountInfo], seed: &Option<[u8; 8]>) -> ProgramResult {
    msg!("GatewayInstruction::IssueVanilla");
    let account_info_iter = &mut accounts.iter();
    let funder_info = next_account_info(account_info_iter)?;
    let data_info = next_account_info(account_info_iter)?;

    let owner_info = next_account_info(account_info_iter)?;
    let gatekeeper_account_info = next_account_info(account_info_iter)?;
    let gatekeeper_account = try_from_slice_incomplete::<Gatekeeper>(*gatekeeper_account_info.data.borrow())?;

    let gatekeeper_authority_info = next_account_info(account_info_iter)?;
    let gatekeeper_network_info = next_account_info(account_info_iter)?;

    let rent_info = next_account_info(account_info_iter)?;
    let system_program_info = next_account_info(account_info_iter)?;
    let rent = &Rent::from_account_info(rent_info)?;

    let (gateway_token_address, gateway_token_bump_seed) = get_gateway_token_address_with_seed(
        owner_info.key,
        &seed
    );
    if gateway_token_address != *data_info.key {
        msg!("Error: gateway_token address derivation mismatch");
        return Err(ProgramError::InvalidArgument);
    }

    let data_len = data_info.data.borrow().len();
    if data_len > 0 {
        msg!("Error: Gateway_token account already initialized");
        return Err(ProgramError::AccountAlreadyInitialized);
    }

    if gatekeeper_account.authority != *gatekeeper_authority_info.key {
        msg!("Error: incorrect gatekeeper authority");
        return Err(ProgramError::InvalidArgument);
    }

    if gatekeeper_account.network != *gatekeeper_network_info.key {
        msg!("Error: incorrect gatekeeper network");
        return Err(ProgramError::InvalidArgument);
    }

    let gateway_token_signer_seeds: &[&[_]] =
        &[&owner_info.key.to_bytes(), GATEWAY_TOKEN_ADDRESS_SEED, &seed.unwrap_or_default(), &[gateway_token_bump_seed]];

    let gateway_token = GatewayToken::new_vanilla(
        owner_info.key,
        gatekeeper_network_info.key,
        gatekeeper_account_info.key);
    //let size = GatewayToken::try_to_vec(&gateway_token).unwrap().len() as u64;
    let size = get_instance_packed_len(&gateway_token).unwrap() as u64;

    invoke_signed(
        &system_instruction::create_account(
            funder_info.key,
            data_info.key,
            1.max(rent.minimum_balance(size as usize)),
            size,
            &id(),
        ),
        &[
            funder_info.clone(),
            data_info.clone(),
            system_program_info.clone(),
        ],
        &[&gateway_token_signer_seeds],
    )?;

    gateway_token.serialize(&mut *data_info.data.borrow_mut())
        .map_err(|e| e.into()) as ProgramResult
}
