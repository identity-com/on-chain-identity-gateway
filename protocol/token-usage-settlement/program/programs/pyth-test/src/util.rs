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

pub fn get_attr_str<'a,T>( ite: & mut T ) -> String
    where T : Iterator<Item=& 'a u8>
{
    let mut len = *ite.next().unwrap() as usize;
    let mut val = String::with_capacity( len );
    while len > 0 {
        val.push( *ite.next().unwrap() as char );
        len -= 1;
    }
    return val
}

pub fn get_price_type( ptype: &PriceType ) -> &'static str
{
    match ptype {
        PriceType::Unknown    => "unknown",
        PriceType::Price      => "price",
    }
}

pub fn get_status( st: &PriceStatus ) -> &'static str
{
    match st {
        PriceStatus::Unknown => "unknown",
        PriceStatus::Trading => "trading",
        PriceStatus::Halted  => "halted",
        PriceStatus::Auction => "auction",
    }
}

pub fn get_corp_act( cact: &CorpAction ) -> &'static str
{
    match cact {
        CorpAction::NoCorpAct => "nocorpact",
    }
}