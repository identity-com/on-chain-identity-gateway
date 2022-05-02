#![warn(clippy::pedantic)]

use rustc_version::{version_meta, Channel};

fn main() {
    let version_meta = version_meta().unwrap();
    // Set cfg flags depending on release channel
    let channel = match version_meta.channel {
        Channel::Stable => "CHANNEL_STABLE",
        Channel::Beta => "CHANNEL_BETA",
        Channel::Nightly => "CHANNEL_NIGHTLY",
        Channel::Dev => "CHANNEL_DEV",
    };
    println!("cargo:rustc-cfg={}", channel);
    println!(
        "cargo:rustc-cfg=VERSION_{}_{}_{}",
        version_meta.semver.major, version_meta.semver.minor, version_meta.semver.patch
    );
    if version_meta.semver.minor > 59 {
        println!("cargo:rustc-cfg=VERSION_GREATER_THAN_59");
    }
    assert!(
        version_meta.semver.minor >= 59,
        "rustc version too old for cruiser, please upgrade to 1.59 or newer (solana cli >=1.9.17)"
    );
}
