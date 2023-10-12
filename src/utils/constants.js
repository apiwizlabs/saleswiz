export const rolesOptions = [
    { label: "Sales Owner", value: "SALES_OWNER" },
    { label: "Account Owner", value: "ACCOUNT_OWNER" },
    { label: "Pre Sales", value: "PRE_SALES" },
    { label: "Engineering", value: "ENGINEERING" },
    { label: "Marketing", value: "MARKETING" },
    { label: "Admin", value: "ADMIN" },
    { label: "Organisation Owner", value: "ORG_OWNER" }
];


export const ADMIN_ROLES = ["ADMIN", "ORG_OWNER"]
export const STANDARD_ROLES = ["PRE_SALES", "ENGINEERING", "MARKETING" ]
export const TEAM_LEADS = ["SALES_OWNER", "ACCOUNT_OWNER"]
export const TEAM_MEMBERS = ["SALES_OWNER", "ACCOUNT_OWNER", "PRE_SALES", "ENGINEERING", "MARKETING" ]
export const SALES_OWNER = ["SALES_OWNER"] 
export const ACTIVE_ROLES = ["SALES_OWNER", "ADMIN", "ORG_OWNER", "ACCOUNT_OWNER"] 
export const ADMIN_SALES = ["SALES_OWNER", "ADMIN", "ORG_OWNER"] 
export const fieldTypes = [
    "Text Field",
    "Number",
    "Text Area",
    "Dropdown",
    "Checkbox",
    "Radio",
    "Date Picker",
    "Currency"
]
// export const PageSize = 5; //local
export const PageSize = 10; //prod