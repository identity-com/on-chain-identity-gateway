//! Program state processor

use solana_gateway::{
    state::{
        get_expire_address_with_seed, get_gatekeeper_address_with_seed,
        get_gateway_token_address_with_seed, verify_gatekeeper, AddressSeed, GatewayTokenAccess,
        GatewayTokenState, GATEKEEPER_ADDRESS_SEED, GATEWAY_TOKEN_ADDRESS_SEED,
        NETWORK_EXPIRE_FEATURE_SEED,
    },
    instruction::{GatewayInstruction, NetworkFeature},
    error::GatewayError,
    Gateway,
};
use solana_program::clock::{Clock, UnixTimestamp};
use {
    borsh::{BorshDeserialize, BorshSerialize},
    solana_gateway::state::GatewayToken,
    solana_program::{
        account_info::{next_account_info, AccountInfo},
        entrypoint::ProgramResult,
        msg,
        program::invoke_signed,
        program_error::ProgramError,
        pubkey::Pubkey,
        rent::Rent,
        system_instruction, system_program,
        sysvar::Sysvar,
    },
};

/// Instruction processor
pub fn process_instruction(
    _program_id: &Pubkey,
    accounts: &[AccountInfo],
    input: &[u8],
) -> ProgramResult {
    let instruction = GatewayInstruction::try_from_slice(input)?;

    let result = match instruction {
        GatewayInstruction::AddGatekeeper {} => add_gatekeeper(accounts),
        GatewayInstruction::Issue { seed, expire_time } => {
            issue(accounts, &seed, &expire_time)
        }
        GatewayInstruction::SetState { state } => set_state(accounts, state),
        GatewayInstruction::UpdateExpiry { expire_time } => update_expiry(accounts, expire_time),
        GatewayInstruction::RemoveGatekeeper => remove_gatekeeper(accounts),
        GatewayInstruction::ExpireToken {
            gatekeeper_network, ..
        } => expire_token(accounts, gatekeeper_network),
        GatewayInstruction::AddFeatureToNetwork { feature } => {
            add_feature_to_network(accounts, feature)
        }
        GatewayInstruction::RemoveFeatureFromNetwork { feature } => {
            remove_feature_from_network(accounts, feature)
        }
    };

    if let Some(e) = result.clone().err() {
        msg!("Gateway Program Error {:?}", e)
    };

    result
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

    if !funder_info.is_signer {
        msg!("Funder signature missing");
        return Err(ProgramError::MissingRequiredSignature);
    }

    if !gatekeeper_network_info.is_signer {
        msg!("Gatekeeper network signature missing");
        return Err(ProgramError::MissingRequiredSignature);
    }

    let (gatekeeper_address, gatekeeper_bump_seed) = get_gatekeeper_address_with_seed(
        gatekeeper_authority_info.key,
        gatekeeper_network_info.key,
    );
    if gatekeeper_address != *gatekeeper_account_info.key {
        msg!("Error: gatekeeper account address derivation mismatch");
        return Err(ProgramError::InvalidArgument);
    }

    let gatekeeper_signer_seeds: &[&[_]] = &[
        &gatekeeper_authority_info.key.to_bytes(),
        &gatekeeper_network_info.key.to_bytes(),
        GATEKEEPER_ADDRESS_SEED,
        &[gatekeeper_bump_seed],
    ];

    msg!("Creating gatekeeper account");
    invoke_signed(
        &system_instruction::create_account(
            funder_info.key,
            gatekeeper_account_info.key,
            1.max(rent.minimum_balance(0)),
            0,
            &Gateway::program_id(),
        ),
        &[
            funder_info.clone(),
            gatekeeper_account_info.clone(),
            // system_program_info.clone(),
        ],
        &[gatekeeper_signer_seeds],
    )?;

    msg!("Gatekeeper account created");

    Ok(())
}

fn issue(
    accounts: &[AccountInfo],
    seed: &Option<AddressSeed>,
    expire_time: &Option<UnixTimestamp>,
) -> ProgramResult {
    msg!("GatewayInstruction::Issue");
    let account_info_iter = &mut accounts.iter();
    let funder_info = next_account_info(account_info_iter)?;
    let gateway_token_info = next_account_info(account_info_iter)?;

    let owner_info = next_account_info(account_info_iter)?;
    let gatekeeper_account_info = next_account_info(account_info_iter)?;

    let gatekeeper_authority_info = next_account_info(account_info_iter)?;
    let gatekeeper_network_info = next_account_info(account_info_iter)?;

    let rent_info = next_account_info(account_info_iter)?;
    let system_program_info = next_account_info(account_info_iter)?;
    let rent = &Rent::from_account_info(rent_info)?;

    if !gatekeeper_authority_info.is_signer {
        msg!("Gatekeeper authority signature missing");
        return Err(ProgramError::MissingRequiredSignature);
    }

    verify_gatekeeper(
        gatekeeper_account_info,
        gatekeeper_authority_info.key,
        gatekeeper_network_info.key,
    )?;

    let (gateway_token_address, gateway_token_bump_seed) =
        get_gateway_token_address_with_seed(owner_info.key, seed, gatekeeper_network_info.key);
    if gateway_token_address != *gateway_token_info.key {
        msg!("Error: gateway_token address derivation mismatch");
        return Err(ProgramError::InvalidArgument);
    }

    let data_len = gateway_token_info.data.borrow().len();
    if data_len > 0 {
        msg!("Error: Gateway_token account already initialized");
        return Err(ProgramError::AccountAlreadyInitialized);
    }

    let gateway_token_signer_seeds: &[&[_]] = &[
        &owner_info.key.to_bytes(),
        GATEWAY_TOKEN_ADDRESS_SEED,
        &seed.unwrap_or_default(),
        &gatekeeper_network_info.key.to_bytes(),
        &[gateway_token_bump_seed],
    ];

    let gateway_token = GatewayToken::new(
        owner_info.key,
        gatekeeper_network_info.key,
        gatekeeper_authority_info.key,
        expire_time,
    );

    invoke_signed(
        &system_instruction::create_account(
            funder_info.key,
            gateway_token_info.key,
            1.max(rent.minimum_balance(GatewayToken::SIZE as usize)),
            GatewayToken::SIZE as u64,
            &Gateway::program_id(),
        ),
        &[
            funder_info.clone(),
            gateway_token_info.clone(),
            system_program_info.clone(),
        ],
        &[gateway_token_signer_seeds],
    )?;

    gateway_token
        .serialize(&mut *gateway_token_info.data.borrow_mut())
        .map_err(|e| e.into()) as ProgramResult
}

fn set_state(accounts: &[AccountInfo], state: GatewayTokenState) -> ProgramResult {
    msg!("GatewayInstruction::SetState");
    let account_info_iter = &mut accounts.iter();
    let gateway_token_info = next_account_info(account_info_iter)?;
    let gatekeeper_authority_info = next_account_info(account_info_iter)?;
    let gatekeeper_account_info = next_account_info(account_info_iter)?;

    if !gatekeeper_authority_info.is_signer {
        msg!("Gatekeeper authority signature missing");
        return Err(ProgramError::MissingRequiredSignature);
    }

    if gateway_token_info.owner.ne(&Gateway::program_id()) {
        msg!("Incorrect program Id for gateway token account");
        return Err(ProgramError::IncorrectProgramId);
    }

    let mut gateway_token = Gateway::parse_gateway_token(gateway_token_info)?;

    verify_gatekeeper(
        gatekeeper_account_info,
        gatekeeper_authority_info.key,
        &gateway_token.gatekeeper_network,
    )?;

    // check that the required state change is allowed
    if !gateway_token.is_valid_state_change(&state) {
        msg!(
            "Error: invalid state change from {:?} to {:?}",
            gateway_token.state,
            state
        );
        return Err(GatewayError::InvalidStateChange.into());
    }

    // Only the issuing gatekeeper can freeze or unfreeze a GT
    // Any gatekeeper in the network (checked above) can revoke
    if (state == GatewayTokenState::Frozen || state == GatewayTokenState::Active)
        && gateway_token.issuing_gatekeeper != *gatekeeper_authority_info.key
    {
        msg!("Error: Only the issuing gatekeeper can freeze or unfreeze");
        return Err(GatewayError::IncorrectGatekeeper.into());
    }

    gateway_token.state = state;

    gateway_token
        .serialize(&mut *gateway_token_info.data.borrow_mut())
        .map_err(|e| e.into()) as ProgramResult
}

fn update_expiry(accounts: &[AccountInfo], expire_time: UnixTimestamp) -> ProgramResult {
    msg!("GatewayInstruction::UpdateExpiry");
    let account_info_iter = &mut accounts.iter();
    let gateway_token_info = next_account_info(account_info_iter)?;
    let gatekeeper_authority_info = next_account_info(account_info_iter)?;
    let gatekeeper_account_info = next_account_info(account_info_iter)?;

    if !gatekeeper_authority_info.is_signer {
        msg!("Gatekeeper authority signature missing");
        return Err(ProgramError::MissingRequiredSignature);
    }

    if gateway_token_info.owner.ne(&Gateway::program_id()) {
        msg!("Incorrect program Id for gateway token account");
        return Err(ProgramError::IncorrectProgramId);
    }

    let mut gateway_token = Gateway::parse_gateway_token(gateway_token_info)?;

    verify_gatekeeper(
        gatekeeper_account_info,
        gatekeeper_authority_info.key,
        &gateway_token.gatekeeper_network,
    )?;

    gateway_token.set_expire_time(expire_time);

    gateway_token
        .serialize(&mut *gateway_token_info.data.borrow_mut())
        .map_err(|e| e.into()) as ProgramResult
}

fn remove_gatekeeper(accounts: &[AccountInfo]) -> ProgramResult {
    msg!("GatewayInstruction::RemoveGatekeeper");
    let account_info_iter = &mut accounts.iter();
    let funds_to_info = next_account_info(account_info_iter)?;
    let gatekeeper_account_info = next_account_info(account_info_iter)?;
    let gatekeeper_authority_info = next_account_info(account_info_iter)?;
    let gatekeeper_network_info = next_account_info(account_info_iter)?;

    if !gatekeeper_network_info.is_signer {
        msg!("Gatekeeper network signature missing");
        return Err(ProgramError::MissingRequiredSignature);
    }

    let (gatekeeper_address, _gatekeeper_bump_seed) = get_gatekeeper_address_with_seed(
        gatekeeper_authority_info.key,
        gatekeeper_network_info.key,
    );
    if gatekeeper_address != *gatekeeper_account_info.key {
        msg!("Error: gatekeeper account address derivation mismatch");
        return Err(ProgramError::InvalidArgument);
    }

    let mut gatekeeper_lamports = gatekeeper_account_info.lamports.borrow_mut();

    **funds_to_info.lamports.borrow_mut() += **gatekeeper_lamports;
    **gatekeeper_lamports = 0;

    Ok(())
}

fn expire_token(accounts: &[AccountInfo], gatekeeper_network: Pubkey) -> ProgramResult {
    msg!("GatewayInstruction::ExpireToken");
    let account_info_iter = &mut accounts.iter();
    let gateway_token_info = next_account_info(account_info_iter)?;
    let owner = next_account_info(account_info_iter)?;
    let network_expire_feature = next_account_info(account_info_iter)?;

    if !owner.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    if network_expire_feature.owner != &Gateway::program_id() {
        return Err(ProgramError::IllegalOwner);
    }

    if &get_expire_address_with_seed(&gatekeeper_network).0 != network_expire_feature.key {
        return Err(ProgramError::InvalidArgument);
    }

    if gateway_token_info.owner != &Gateway::program_id() {
        return Err(ProgramError::IllegalOwner);
    }

    let mut gateway_token = Gateway::parse_gateway_token(&gateway_token_info).unwrap();

    if gateway_token.owner_wallet() != owner.key {
        return Err(GatewayError::InvalidOwner.into());
    }

    if gateway_token.gatekeeper_network() != &gatekeeper_network {
        return Err(ProgramError::InvalidAccountData);
    }

    gateway_token
        .set_expire_time(Clock::get()?.unix_timestamp - 120);

    Ok(())
}

fn add_feature_to_network(accounts: &[AccountInfo], feature: NetworkFeature) -> ProgramResult {
    msg!("GatewayInstruction::AddFeatureToNetwork");
    let account_info_iter = &mut accounts.iter();
    let funder_account = next_account_info(account_info_iter)?;
    let gatekeeper_network = next_account_info(account_info_iter)?;
    let feature_account = next_account_info(account_info_iter)?;
    let system_program = next_account_info(account_info_iter)?;

    if !gatekeeper_network.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    if system_program.key != &system_program::id() {
        return Err(ProgramError::InvalidArgument);
    }

    match feature {
        NetworkFeature::UserTokenExpiry => {
            let (key, bump_seed) = get_expire_address_with_seed(gatekeeper_network.key);
            if &key != feature_account.key {
                return Err(ProgramError::InvalidArgument);
            }
            let seeds = &[
                &gatekeeper_network.key.to_bytes(),
                NETWORK_EXPIRE_FEATURE_SEED,
                &[bump_seed],
            ] as &[&[u8]];

            invoke_signed(
                &solana_program::system_instruction::create_account(
                    funder_account.key,
                    feature_account.key,
                    1.max(Rent::default().minimum_balance(0)),
                    0,
                    &Gateway::program_id(),
                ),
                &[
                    system_program.clone(),
                    funder_account.clone(),
                    feature_account.clone(),
                ],
                &[seeds],
            )
        }
    }
}

fn remove_feature_from_network(accounts: &[AccountInfo], feature: NetworkFeature) -> ProgramResult {
    msg!("GatewayInstruction::RemoveFeatureFromNetwork");
    let account_info_iter = &mut accounts.iter();
    let funds_to_account = next_account_info(account_info_iter)?;
    let gatekeeper_network = next_account_info(account_info_iter)?;
    let feature_account = next_account_info(account_info_iter)?;

    if !gatekeeper_network.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    match feature {
        NetworkFeature::UserTokenExpiry => {
            if &get_expire_address_with_seed(gatekeeper_network.key).0 != feature_account.key {
                return Err(ProgramError::InvalidArgument);
            }
        }
    };

    **funds_to_account.lamports.borrow_mut() += **feature_account.lamports.borrow();
    **feature_account.lamports.borrow_mut() = 0;

    Ok(())
}

#[cfg(test)]
pub mod tests {
    use super::*;

    #[test]
    fn set_state_should_fail_with_invalid_program_owner_on_gateway_token() {
        let invalid_owner = Default::default();
        let instruction = GatewayInstruction::SetState {
            state: GatewayTokenState::Frozen,
        };

        // create all the accounts.
        // due to the nature of the AccountInfo struct (borrowing most properties),
        // this code has to remain in-line and have unnecesssary extra variables
        // (e.g. the lamports variables)
        let gatekeeper_token_address = Default::default();
        let mut gateway_token_lamports = 0;
        let mut gatekeeper_authority_lamports = 0;
        let mut gatekeeper_account_lamports = 0;
        let rent_epoch = 0;
        let owner = id();
        let gatekeeper_authority = Default::default();
        let gatekeeper_account = Default::default();
        let gateway_token = AccountInfo::new(
            &gatekeeper_token_address,
            false,
            false,
            &mut gateway_token_lamports,
            &mut [],
            &invalid_owner,
            false,
            rent_epoch,
        );
        let gatekeeper_authority = AccountInfo::new(
            &gatekeeper_authority,
            true,
            false,
            &mut gatekeeper_authority_lamports,
            &mut [],
            &owner,
            false,
            rent_epoch,
        );
        let gatekeeper_account = AccountInfo::new(
            &gatekeeper_account,
            false,
            false,
            &mut gatekeeper_account_lamports,
            &mut [],
            &owner,
            false,
            rent_epoch,
        );
        let accounts = vec![gateway_token, gatekeeper_authority, gatekeeper_account];

        // create the transaction
        let process_result = process_instruction(
            &owner,
            accounts.as_slice(),
            &instruction.try_to_vec().unwrap(),
        );

        assert!(matches!(
            process_result,
            Err(ProgramError::IncorrectProgramId)
        ))
    }

    #[test]
    fn set_state_should_fail_with_missing_gatekeeper_authority_signature() {
        let instruction = GatewayInstruction::SetState {
            state: GatewayTokenState::Frozen,
        };

        // create all the accounts.
        // due to the nature of the AccountInfo struct (borrowing most properties),
        // this code has to remain in-line and have unnecesssary extra variables
        // (e.g. the lamports variables)
        let gatekeeper_token_address = Default::default();
        let mut gateway_token_lamports = 0;
        let mut gatekeeper_authority_lamports = 0;
        let mut gatekeeper_account_lamports = 0;
        let rent_epoch = 0;
        let owner = id();
        let gatekeeper_authority = Default::default();
        let gatekeeper_account = Default::default();
        let gateway_token = AccountInfo::new(
            &gatekeeper_token_address,
            false,
            false,
            &mut gateway_token_lamports,
            &mut [],
            &owner,
            false,
            rent_epoch,
        );
        let gatekeeper_authority = AccountInfo::new(
            &gatekeeper_authority,
            false,
            false,
            &mut gatekeeper_authority_lamports,
            &mut [],
            &owner,
            false,
            rent_epoch,
        );
        let gatekeeper_account = AccountInfo::new(
            &gatekeeper_account,
            false,
            false,
            &mut gatekeeper_account_lamports,
            &mut [],
            &owner,
            false,
            rent_epoch,
        );
        let accounts = vec![gateway_token, gatekeeper_authority, gatekeeper_account];

        // create the transaction
        let process_result = process_instruction(
            &owner,
            accounts.as_slice(),
            &instruction.try_to_vec().unwrap(),
        );

        assert!(matches!(
            process_result,
            Err(ProgramError::MissingRequiredSignature)
        ))
    }
}
