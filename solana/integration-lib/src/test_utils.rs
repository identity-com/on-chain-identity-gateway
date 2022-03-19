#[cfg(test)]
pub mod test_utils_stubs {
    use crate::Gateway;
    use solana_program::account_info::AccountInfo;
    use solana_program::clock::{Clock, UnixTimestamp};
    use solana_program::entrypoint::ProgramResult;
    use solana_program::instruction::Instruction;
    use solana_program::program_stubs;
    use std::sync::Once;
    use std::time::{SystemTime, UNIX_EPOCH};

    static INIT_TESTS: Once = Once::new();

    // Get the current unix timestamp from SystemTime
    pub fn now() -> UnixTimestamp {
        let start = SystemTime::now();
        let now = start
            .duration_since(UNIX_EPOCH)
            .expect("Time went backwards");

        now.as_secs() as UnixTimestamp
    }

    // Create stubs for anything we need that is provided by the solana runtime
    struct TestSyscallStubs {}

    impl program_stubs::SyscallStubs for TestSyscallStubs {
        // create a stub clock object and set it at the provided address
        fn sol_get_clock_sysvar(&self, var_addr: *mut u8) -> u64 {
            // we only need the unix_timestamp
            let stub_clock = Clock {
                slot: 0,
                epoch_start_timestamp: 0,
                epoch: 0,
                leader_schedule_epoch: 0,
                unix_timestamp: now(),
            };

            // rust magic
            unsafe {
                *(var_addr as *mut _ as *mut Clock) = stub_clock;
            }

            0
        }

        fn sol_invoke_signed(
            &self,
            instruction: &Instruction,
            account_infos: &[AccountInfo],
            _signers_seeds: &[&[&[u8]]],
        ) -> ProgramResult {
            if instruction.program_id == Gateway::program_id() {
                solana_gateway_program::processor::process_instruction(
                    &instruction.program_id,
                    account_infos,
                    &instruction.data,
                )
            } else {
                panic!("Cannot execute other programs");
            }
        }
    }

    // Inject stubs into the solana program singleton
    pub fn init() {
        INIT_TESTS.call_once(|| {
            program_stubs::set_syscall_stubs(Box::new(TestSyscallStubs {}));
        });
    }
}
