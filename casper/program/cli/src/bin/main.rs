use clap::Clap;
use cli::Opts;
use solana_client::client_error::ClientError;

fn main() -> Result<(),ClientError> {
    let opts = Opts::parse();
    cli::start(opts)
}
