use std::sync::Once;
use std::time::{SystemTime, UNIX_EPOCH};
use solana_program::clock::{Clock, UnixTimestamp};
use solana_program::program_stubs;

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
}
// Inject stubs into the solana program singleton
pub fn init() {
    INIT_TESTS.call_once(|| {
        program_stubs::set_syscall_stubs(Box::new(TestSyscallStubs {}));
    });
}