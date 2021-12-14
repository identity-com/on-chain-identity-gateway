use anchor_lang::prelude::*;
use pyth_client::{
    AccountType,
    Mapping,
    Product,
    Price,
    PriceType,
    PriceStatus,
    CorpAction,
    cast,
    MAGIC,
    VERSION_2,
    PROD_HDR_SIZE
};
use std::{
    str::FromStr
};
use crate::util::{get_corp_act, get_price_type, get_status};

mod util;

declare_id!("GXD3V5AQTDrszePsSjH1yQNvfCceumZp1jM9mQR4fMPH");

#[program]
pub mod pyth_test {
    use super::*;

    pub fn run(ctx: Context<Run>) -> ProgramResult {
        let product_info = ctx.accounts.product.to_account_info();
        let mut product_data = product_info.try_borrow_mut_data()?;
        let product_dst: &mut [u8] = &mut product_data;

        let prod_acct = cast::<Product>( product_dst );

        if prod_acct.px_acc.is_valid() {
            let price_info = ctx.accounts.price.to_account_info();
            let mut price_data = price_info.try_borrow_mut_data()?;
            let price_dst: &mut [u8] = &mut price_data;
            let pa = cast::<Price>( price_dst );

            assert_eq!( pa.magic, MAGIC, "not a valid pyth account" );
            assert_eq!( pa.atype, AccountType::Price as u32,
                        "not a valid pyth price account" );
            assert_eq!( pa.ver, VERSION_2,
                        "unexpected pyth price account version" );
            println!( "  price_account .. {:?}", ctx.accounts.price.key );

            // let maybe_price = pa.get_current_price();
            // match maybe_price {
            //     Some((price, confidence, expo)) => {
            //         println!("    price ........ {} x 10^{}", price, expo);
            //         println!("    conf ......... {} x 10^{}", confidence, expo);
            //     }
            //     None => {
            //         println!("    price ........ unavailable");
            //         println!("    conf ......... unavailable");
            //     }
            // }
            println!( "    price ... {}", pa.agg.price);

            // println!( "    price_type ... {}", get_price_type(&pa.ptype));
            // println!( "    exponent ..... {}", pa.expo );
            // println!( "    status ....... {}", get_status(&pa.agg.status));
            // println!( "    corp_act ..... {}", get_corp_act(&pa.agg.corp_act));
            // 
            // println!( "    num_qt ....... {}", pa.num_qt );
            // println!( "    valid_slot ... {}", pa.valid_slot );
            // println!( "    publish_slot . {}", pa.agg.pub_slot );
            // 
            // let maybe_twap = pa.get_twap();
            // match maybe_twap {
            //     Some((twap, expo)) => {
            //         println!( "    twap ......... {} x 10^{}", twap, expo );
            //     }
            //     None => {
            //         println!( "    twap ......... unavailable");
            //     }
            // }
            // 
            // println!( "    twac ......... {}", pa.twac.val );
        }
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Run<'info> {
    #[account()]
    product: AccountInfo<'info>,
    #[account()]
    price: AccountInfo<'info>,
}
