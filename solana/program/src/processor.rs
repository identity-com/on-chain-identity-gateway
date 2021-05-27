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
use crate::state::{get_gatekeeper_address_with_seed, GATEKEEPER_ADDRESS_SEED, Transitionable, AddressSeed};
use solana_gateway::state::GatewayTokenState;
use solana_gateway::error::GatewayError;
use solana_program::clock::UnixTimestamp;

/// Instruction processor
pub fn process_instruction(
    _program_id: &Pubkey,
    accounts: &[AccountInfo],
    input: &[u8],
) -> ProgramResult {
    let instruction = GatewayInstruction::try_from_slice(input)?;

    match instruction {
        GatewayInstruction::AddGatekeeper { } => add_gatekeeper(accounts),
        GatewayInstruction::IssueVanilla { seed, expire_time  } => issue_vanilla(accounts, &seed, &expire_time),
        GatewayInstruction::SetState { state  } => set_state(accounts, state),
        GatewayInstruction::UpdateExpiry { expire_time  } => update_expiry(accounts, expire_time)
    }
}

fn add_gatekeeper(accounts: &[AccountInfo]) -> ProgramResult {
    msg!("GatewayInstruction::AddGatekeeper");
    let account_info_iter = &mut accounts.iter();
    let funder_info = next_account_info(account_info_iter)?;
    let gatekeeper_account_info = next_account_info(account_info_iter)?;
    let gatekeeper_authority_info = next_account_info(account_info_iter)?;
    let gatekeeper_network_info = next_account_info(account_info_iter)?;

    let rent_info = next_account_info(account_info_iter)?;
    let system_program_info = next_account_info(account_info_iter)?;
    let rent = &Rent::from_account_info(rent_info)?;

    if !gatekeeper_network_info.is_signer {
        msg!("Gatekeeper network signature missing");
        return Err(ProgramError::MissingRequiredSignature);
    }

    let (gatekeeper_address, gatekeeper_bump_seed) = get_gatekeeper_address_with_seed(
        gatekeeper_authority_info.key
    );
    if gatekeeper_address != *gatekeeper_account_info.key {
        msg!("Error: gatekeeper account address derivation mismatch");
        return Err(ProgramError::InvalidArgument);
    }

    let data_len = gatekeeper_account_info.data.borrow().len();
    if data_len > 0 {
        msg!("Error: gatekeeper account already initialized");
        return Err(ProgramError::AccountAlreadyInitialized);
    }

    let gatekeeper_signer_seeds: &[&[_]] =
        &[&gatekeeper_authority_info.key.to_bytes(), GATEKEEPER_ADDRESS_SEED, &[gatekeeper_bump_seed]];

    let gatekeeper_account = Gatekeeper {
        authority: *gatekeeper_authority_info.key,
        network: *gatekeeper_network_info.key
    };
    let size = get_instance_packed_len(&gatekeeper_account).unwrap() as u64;

    msg!("Creating gatekeeper account");
    invoke_signed(
        &system_instruction::create_account(
            funder_info.key,
            gatekeeper_account_info.key,
            1.max(rent.minimum_balance(size as usize)),
            size,
            &id(),
        ),
        &[
            funder_info.clone(),
            gatekeeper_account_info.clone(),
            system_program_info.clone(),
        ],
        &[&gatekeeper_signer_seeds],
    )?;

    msg!("Gatekeeper account created");

    gatekeeper_account.serialize(&mut *gatekeeper_account_info.data.borrow_mut())
        .map_err(|e| e.into()) as ProgramResult
}

fn issue_vanilla(accounts: &[AccountInfo], seed: &Option<AddressSeed>, expire_time: &Option<UnixTimestamp>) -> ProgramResult {
    msg!("GatewayInstruction::IssueVanilla");
    let account_info_iter = &mut accounts.iter();
    let funder_info = next_account_info(account_info_iter)?;
    let gateway_token_info = next_account_info(account_info_iter)?;

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
    if gateway_token_address != *gateway_token_info.key {
        msg!("Error: gateway_token address derivation mismatch");
        return Err(ProgramError::InvalidArgument);
    }

    let data_len = gateway_token_info.data.borrow().len();
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
        gatekeeper_authority_info.key,
        expire_time);
    let size = get_instance_packed_len(&gateway_token).unwrap() as u64;

    invoke_signed(
        &system_instruction::create_account(
            funder_info.key,
            gateway_token_info.key,
            1.max(rent.minimum_balance(size as usize)),
            size,
            &id(),
        ),
        &[
            funder_info.clone(),
            gateway_token_info.clone(),
            system_program_info.clone(),
        ],
        &[&gateway_token_signer_seeds],
    )?;

    gateway_token.serialize(&mut *gateway_token_info.data.borrow_mut())
        .map_err(|e| e.into()) as ProgramResult
}

fn set_state(accounts: &[AccountInfo], state: GatewayTokenState) -> ProgramResult {
    msg!("GatewayInstruction::SetState");
    let account_info_iter = &mut accounts.iter();
    let gateway_token_info = next_account_info(account_info_iter)?;
    let gatekeeper_authority_info = next_account_info(account_info_iter)?;
    let gatekeeper_account_info = next_account_info(account_info_iter)?;

    let mut gateway_token = try_from_slice_incomplete::<GatewayToken>(*gateway_token_info.data.borrow())?;
    let gatekeeper_account = try_from_slice_incomplete::<Gatekeeper>(*gatekeeper_account_info.data.borrow())?;

    // check the gatekeeper account matches the passed-in gatekeeper key
    if gatekeeper_account.authority != *gatekeeper_authority_info.key {
        msg!("Error: incorrect gatekeeper authority");
        return Err(ProgramError::InvalidArgument);
    }

    // check the gatekeeper account network matches the network on the gateway token
    if gatekeeper_account.network != gateway_token.gatekeeper_network {
        msg!("Error: incorrect gatekeeper network");
        return Err(ProgramError::InvalidArgument);
    }
    
    // check that the required state change is allowed
    if !gateway_token.is_valid_state_change(&state) {
        msg!("Error: invalid state change from {:?} to {:?}", gateway_token.state, state);
        return Err(GatewayError::InvalidStateChange.into());
    }

    // Only the issuing gatekeeper can freeze or unfreeze a GT
    // Any gatekeeper in the network (checked above) can revoke
    if state == GatewayTokenState::Frozen || state == GatewayTokenState::Active {
        if gateway_token.issuing_gatekeeper != *gatekeeper_authority_info.key  {
            msg!("Error: Only the issuing gatekeeper can freeze or unfreeze");
            return Err(GatewayError::IncorrectGatekeeper.into());
        }  
    }

    gateway_token.state = state;
    
    gateway_token.serialize(&mut *gateway_token_info.data.borrow_mut())
        .map_err(|e| e.into()) as ProgramResult
}

fn update_expiry(accounts: &[AccountInfo], expire_time: UnixTimestamp) -> ProgramResult {
    msg!("GatewayInstruction::UpdateExpiry");
    let account_info_iter = &mut accounts.iter();
    let gateway_token_info = next_account_info(account_info_iter)?;
    let gatekeeper_authority_info = next_account_info(account_info_iter)?;
    let gatekeeper_account_info = next_account_info(account_info_iter)?;

    let mut gateway_token = try_from_slice_incomplete::<GatewayToken>(*gateway_token_info.data.borrow())?;
    let gatekeeper_account = try_from_slice_incomplete::<Gatekeeper>(*gatekeeper_account_info.data.borrow())?;

    // check the gatekeeper account matches the passed-in gatekeeper key
    if gatekeeper_account.authority != *gatekeeper_authority_info.key {
        msg!("Error: incorrect gatekeeper authority");
        return Err(ProgramError::InvalidArgument);
    }

    // check the gatekeeper account network matches the network on the gateway token
    if gatekeeper_account.network != gateway_token.gatekeeper_network {
        msg!("Error: incorrect gatekeeper network");
        return Err(ProgramError::InvalidArgument);
    }
    
    gateway_token.set_expire_time(expire_time);

    gateway_token.serialize(&mut *gateway_token_info.data.borrow_mut())
        .map_err(|e| e.into()) as ProgramResult
}
