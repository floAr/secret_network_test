use schemars::JsonSchema;
use serde::{Deserialize, Serialize};
use cosmwasm_std::{HumanAddr, Uint128};

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct InitMsg {
    /// Maximum size of a reminder message in bytes
    pub max_size: i32,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum HandleMsg {
    /// Records a new reminder for the sender
    Record {
        message: String,
        receipient: HumanAddr,
        // amount: Uint128
    },
    /// Requests the current reminder for the sender
    ReadAll { },
    // Claim {
    //     id: u64,
    // }
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum QueryMsg {
    /// Gets basic statistics about the use of the contract
    Stats { }
}

/// Responses from handle functions
#[derive(Serialize, Deserialize, Debug, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum HandleAnswer {
    /// Return a status message to let the user know if it succeeded or failed
    Record {
        status: String,
    },
    /// Return a status message and the current reminder and its timestamp, if it exists
    Read {
        status: String,
        message: Option<String>,
        sender: Option<HumanAddr>,
        // value: Option<Uint128>,
        timestamp: Option<u64>,
    }
}

/// Responses from query functions
#[derive(Serialize, Deserialize, Debug, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum QueryAnswer {
    /// Return basic statistics about contract
    Stats {
        reminder_count: u64,
        total_stake: Uint128,
    }
}
