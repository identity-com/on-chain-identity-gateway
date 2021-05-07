//! Program state processor

use {
    crate::{
        borsh as program_borsh,
        error::GatewayError,
        id,
        instruction::GatewayInstruction,
        state::{get_gateway_token_address_with_seed, GatewayTokenData},
    },
    borsh::{BorshDeserialize, BorshSerialize},
    sol_did::{validate_owner},
    solana_program::{
        account_info::{next_account_info, AccountInfo},
        entrypoint::ProgramResult,
        msg,
        program::invoke_signed,
        program_error::ProgramError,
        program_pack::IsInitialized,
        pubkey::Pubkey,
        rent::Rent,
        system_instruction,
        sysvar::Sysvar,
    }
};
use crate::state::{ADDRESS_SEED, Message};


fn check_authority(authority_info: &AccountInfo, did: &AccountInfo, gateway_token: &GatewayTokenData) -> ProgramResult {
    if !authority_info.is_signer {
        msg!("Gateway Token authority signature missing");
        return Err(ProgramError::MissingRequiredSignature);
    }

    if !(gateway_token.owner.eq(did.key)) {
        msg!("Incorrect Gateway Token authority provided");
        return Err(GatewayError::IncorrectAuthority.into())
    }
    
    validate_owner(did, &[authority_info])
}

/// Instruction processor
pub fn process_instruction(
    _program_id: &Pubkey,
    accounts: &[AccountInfo],
    input: &[u8],
) -> ProgramResult {
    let instruction = GatewayInstruction::try_from_slice(input)?;
    let account_info_iter = &mut accounts.iter();

    match instruction {
        GatewayInstruction::Issue { } => {
            msg!("GatewayInstruction::Issue");
            let funder_info = next_account_info(account_info_iter)?;
            let data_info = next_account_info(account_info_iter)?;
            let owner_did_info = next_account_info(account_info_iter)?;
            let rent_info = next_account_info(account_info_iter)?;
            let system_program_info = next_account_info(account_info_iter)?;
            let rent = &Rent::from_account_info(rent_info)?;
            
            let size
            
            let (gateway_token_address, gateway_token_bump_seed) = get_gateway_token_address_with_seed(owner_did_info.key);
            if gateway_token_address != *data_info.key {
                msg!("Error: gateway_token address derivation mismatch");
                return Err(ProgramError::InvalidArgument);
            }
            
            let data_len = data_info.data.borrow().len();
            if data_len > 0 {
                msg!("Gateway_token account already initialized");
                return Err(ProgramError::AccountAlreadyInitialized);
            }
            
            let gateway_token_signer_seeds: &[&[_]] =
                &[&owner_did_info.key.to_bytes(), ADDRESS_SEED, &[gateway_token_bump_seed]];
            
            msg!("Creating data account");
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
            
            let gateway_token = Gateway_tokenData::new(*owner_did_info.key);
            gateway_token.serialize(&mut *data_info.data.borrow_mut())
                .map_err(|e| e.into())
        }
    }
}
