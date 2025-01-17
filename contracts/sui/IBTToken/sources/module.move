#[allow(duplicate_alias, lint(custom_state_change))]
module ibttoken::IBTToken {
    use sui::object::{Self, UID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::coin::{Self, Coin};
    use sui::balance::{Self, Supply};
    use sui::event;

    public struct AdminCap has key {
        id: UID,
        supply: Supply<IBTToken>
    }

    public struct IBTToken has drop {}

    public struct TokensBurned has copy, drop {
        burner: address,
        amount: u64,
        destination_chain: vector<u8>
    }

    public struct TokensMinted has copy, drop {
        minter: address,
        recipient: address,
        amount: u64,
        source_chain: vector<u8>
    }

    fun init(ctx: &mut TxContext) {
        let supply = balance::create_supply(IBTToken {});

        transfer::transfer(
            AdminCap {
                id: object::new(ctx),
                supply,
            },
            tx_context::sender(ctx),
        );
    }

    public entry fun mint(admin: &mut AdminCap, balance: u64, ctx: &mut TxContext) {
        let _ = admin; 
        let balance = balance::increase_supply(&mut admin.supply, balance);
        let coin = coin::from_balance(balance, ctx);
        transfer::public_transfer(coin, tx_context::sender(ctx)); 
    }

public entry fun mint_to_destination(admin: &mut AdminCap, recipient: address, amount: u64, ctx: &mut TxContext) {
    let _ = admin; // Ensure admin is used
    let balance = balance::increase_supply(&mut admin.supply, amount);
    let coin = coin::from_balance(balance, ctx);
    transfer::public_transfer(coin, recipient); // Transfer to the specified recipient
}

public entry fun burn_exact_for_bridge(
    admin: &mut AdminCap,
    coin: &mut Coin<IBTToken>,
    amount: u64,
    destination_chain: vector<u8>,
    ctx: &mut TxContext
) {
    assert!(coin::value(coin) >= amount, 0); 
    let extracted = coin::split(coin, amount, ctx); 
    let balance = coin::into_balance(extracted); 
    balance::decrease_supply(&mut admin.supply, balance);
    event::emit(TokensBurned {
        burner: tx_context::sender(ctx),
        amount,
        destination_chain
    });
}


    public entry fun burn_for_bridge(admin: &mut AdminCap, coin: Coin<IBTToken>, destination_chain: vector<u8>, ctx: &mut TxContext) {
        let _ = admin; 
        let balance = coin::into_balance(coin);
        let amount = balance::value(&balance);
        balance::decrease_supply(&mut admin.supply, balance);
        event::emit(TokensBurned {
            burner: tx_context::sender(ctx),
            amount,
            destination_chain
        });
    }

    public entry fun mint_for_bridge(admin: &mut AdminCap, recipient: address, amount: u64, source_chain: vector<u8>, ctx: &mut TxContext) {
        let _ = admin; 
        let balance = balance::increase_supply(&mut admin.supply, amount);
        let coin = coin::from_balance(balance, ctx);
        transfer::public_transfer(coin, recipient);
        event::emit(TokensMinted {
            minter: tx_context::sender(ctx),
            recipient,
            amount,
            source_chain
        });
    }

    public entry fun transfer(coin: Coin<IBTToken>, recipient: address) {
        transfer::public_transfer(coin, recipient);
    }
}