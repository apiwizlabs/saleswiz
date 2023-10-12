module.exports = {
    DB_URL: "<mongo_db_url>",
    NODE_ENV: "development",
    PORT: 3006, // port to run the server
    AWS_BUCKET_NAME: "<aws bucket name>",
    PUBLIC_AWS_BUCKET_NAME: "<public aws bucket name>",
    AWS_REGION: "<aws region>", //same region for public and private buckets
    BASE_URL: "<Base url of frontend Url>",
    TOKEN_EXPIRY: '48h', //24h : expiry time for login token
    UPDATE_TOKEN_EXPIRY: '48h', //6h
    INVITE_EXPIRY: '1h', // invite link expiry
    RESET_EXPIRY: '300000',
    MAIL_HOST:"smtp.gmail.com",
    MAIL_PORT:"<mail host port>",

    MAIL_USER:"<mail id>",
    MAIL_PASSWORD:"<mail password>",
    MAIL_FROM:"<mail id>",
    ADMIN_EMAIL: "<admin email>",
    ADMIN_PASSWORD: "<admin email password>",
}