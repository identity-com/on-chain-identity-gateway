//! Program state processor

use {
    crate::{
        borsh as program_borsh,
        error::SolariumError,
        id,
        instruction::SolariumInstruction,
        state::{get_inbox_address_with_seed, InboxData},
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


fn check_authority(authority_info: &AccountInfo, did: &AccountInfo, inbox: &InboxData) -> ProgramResult {
    if !authority_info.is_signer {
        msg!("Inbox authority signature missing");
        return Err(ProgramError::MissingRequiredSignature);
    }

    if !(inbox.owner.eq(did.key)) {
        msg!("Incorrect Inbox authority provided");
        return Err(SolariumError::IncorrectAuthority.into())
    }
    
    validate_owner(did, &[authority_info])
}

/// Instruction processor
pub fn process_instruction(
    _program_id: &Pubkey,
    accounts: &[AccountInfo],
    input: &[u8],
) -> ProgramResult {
    let instruction = SolariumInstruction::try_from_slice(input)?;
    let account_info_iter = &mut accounts.iter();

    match instruction {
        SolariumInstruction::Initialize { } => { //size, alias } => {
            msg!("SolariumInstruction::Initialize");
            let message_content_size: u64 = 256;
            let message_size = 1 + 32 + message_content_size;
            let size: u64 = (u64::from(InboxData::DEFAULT_SIZE) * message_size) + 32 + 16;

            let funder_info = next_account_info(account_info_iter)?;
            let data_info = next_account_info(account_info_iter)?;
            let owner_did_info = next_account_info(account_info_iter)?;
            let rent_info = next_account_info(account_info_iter)?;
            let system_program_info = next_account_info(account_info_iter)?;
            let rent = &Rent::from_account_info(rent_info)?;
            
            let (inbox_address, inbox_bump_seed) = get_inbox_address_with_seed(owner_did_info.key);
            if inbox_address != *data_info.key {
                msg!("Error: inbox address derivation mismatch");
                return Err(ProgramError::InvalidArgument);
            }
            
            let data_len = data_info.data.borrow().len();
            if data_len > 0 {
                msg!("Inbox account already initialized");
                return Err(ProgramError::AccountAlreadyInitialized);
            }
            
            let inbox_signer_seeds: &[&[_]] =
                &[&owner_did_info.key.to_bytes(), ADDRESS_SEED, &[inbox_bump_seed]];
            
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
                &[&inbox_signer_seeds],
            )?;
            
            let inbox = InboxData::new(*owner_did_info.key);
            inbox.serialize(&mut *data_info.data.borrow_mut())
                .map_err(|e| e.into())
        }

        SolariumInstruction::Post { message } => {
            msg!("SolariumInstruction::Post");
            let data_info = next_account_info(account_info_iter)?;
            let sender_did_info = next_account_info(account_info_iter)?;
            let sender_info = next_account_info(account_info_iter)?;
            let mut inbox =
                program_borsh::try_from_slice_incomplete::<InboxData>(*data_info.data.borrow())?;
            if !inbox.is_initialized() {
                msg!("Inbox account not initialized");
                return Err(ProgramError::UninitializedAccount);
            }

            // Check that the sender of the message is valid
            // the sender signer is an authority on the DID.
            validate_owner(sender_did_info, &[sender_info]).unwrap();
            
            let message_info = Message::new(*sender_did_info.key, message);
            
            inbox.post(message_info);

            inbox.serialize(&mut *data_info.data.borrow_mut())
                .map_err(|e| e.into())
            
            // check_authority(authority_info, &account_data)?;
            // let start = offset as usize;
            // let end = start + data.len();
            // if end > data_info.data.borrow().len() {
            //     return Err(ProgramError::AccountDataTooSmall);
            // } else {
            //     data_info.data.borrow_mut()[start..end].copy_from_slice(&data);
            // }
            // 
            // // make sure the written bytes are valid by trying to deserialize
            // // the update account buffer
            // let _account_data =
            //     program_borsh::try_from_slice_incomplete::<InboxData>(*data_info.data.borrow())?;
            // Ok(())
        }

        SolariumInstruction::CloseAccount => {
            msg!("SolariumInstruction::CloseAccount");
            let data_info = next_account_info(account_info_iter)?;
            let owner_did_info = next_account_info(account_info_iter)?;
            let authority_info = next_account_info(account_info_iter)?;
            let destination_info = next_account_info(account_info_iter)?;
            let account_data =
                program_borsh::try_from_slice_incomplete::<InboxData>(*data_info.data.borrow())?;
            if !account_data.is_initialized() {
                msg!("Inbox not initialized");
                return Err(ProgramError::UninitializedAccount);
            }
            check_authority(authority_info, owner_did_info, &account_data)?;
            let destination_starting_lamports = destination_info.lamports();
            let data_lamports = data_info.lamports();
            **data_info.lamports.borrow_mut() = 0;
            **destination_info.lamports.borrow_mut() = destination_starting_lamports
                .checked_add(data_lamports)
                .ok_or(SolariumError::Overflow)?;
            Ok(())
        }
    }
}
