<p align="center">
    <img src="../public/banner.png" alt="Saleswize banner" />
    <br/>
    <br/>
    <b>Saleswiz: The CRM Solution for Streamlined Sales and Client Management, Customized to Your Needs.</b>
</p>

[![Made with Node.js](https://img.shields.io/badge/Node.js->=14-blue?logo=node.js&logoColor=green)](https://nodejs.org "Go to Node.js homepage")
![GitHub contributors](https://img.shields.io/github/contributors/apiwizlabs/saleswiz-backend)
[![GitHub issues](https://img.shields.io/github/issues/apiwizlabs/saleswiz-backend)](https://github.com/apiwizlabs/saleswiz-backend/issues)
[![GitHub stars](https://img.shields.io/github/stars/apiwizlabs/saleswiz-backend)](https://github.com/apiwizlabs/saleswiz-backend/stargazers)
![GitHub closed issues](https://img.shields.io/github/issues-closed/apiwizlabs/saleswiz-backend)

[![Twitter Follow](https://img.shields.io/badge/Twitter-1DA1F2?style=for-the-badge&logo=twitter&logoColor=white)](https://twitter.com/getapiwiz)
[![Linkedin Follow](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/company/apiwizio/)


[**APIwiz is proud to make Saleswiz public for Contributions**](https://www.apiwiz.io/)  
Saleswiz is the gateway to effortless deal management and well-organized client relationships, empowering Sales Executives within [APIwiz](https://www.apiwiz.io/).

🎉 Now its Open to empower 💪🏻 Sales Executives in your Organisation too

## 🚀 Getting Started
This is the backend code for [Saleswiz](../), <- Click here to go to UI setup  

### ✨ PreRequisites

1. You will need to setup 2 aws buckets, one private and one public. 
    - save the access keys, secret keys, region names and bucket names. these need to be updated in the config and env as gien in the following sections.
2. Generate a RSA public and private key pair using this [website](https://cryptotools.net/rsagen).
3. Enable google oauth for your dns/localhost url. here are the [docs](https://support.google.com/cloud/answer/6158849?hl=en)
4. Enable an existing/new gmail to be used with nodemailer to send email alerts and invites. follow this [blog](https://miracleio.me/snippets/use-gmail-with-nodemailer).
    - the password generated after following the blog will be referred to as "generated email password"
5. Generate a string of your choice to be used as a JWT Secret.   
6. Create a mongodb database and replace the url in the place of <mongo_db_url>

Create a .env file and update the following variables accordingly.

```javascript
PRIVATE_KEY: "<generated RSA private key>"
JWT_SECRET: "<jwt secret>"
GOOGLE_CLIENT_ID: "<google client id for oauth>"
GOOGLE_CLIENT_SECRET: "<google client secret for oauth>"
AWS_ACCESSKEY: "<private aws access key>"
AWS_SECRET_KEY: "<private aws secret key>"
PUBLIC_AWS_ACCESS_KEY: "<public aws access key>"
PUBLIC_AWS_SECRET_KEY: "<public aws secret key>"
```

Navigate to the `./config.js` and update the following variables accordingly

```javascript
{
    DB_URL: "<mongo_db_url>",
    NODE_ENV: "development",
    PORT: 3006, // port to run the server
    AWS_BUCKET_NAME: "<aws bucket name>",
    PUBLIC_AWS_BUCKET_NAME: "<public aws bucket name>",
    AWS_REGION: "<aws region>", //same region for public and private buckets
    BASE_URL: "<Base url of frontend Url>",
    TOKEN_EXPIRY: '48h', //24h : expiry time for login token
    INVITE_EXPIRY: '1h', // invite link expiry
    RESET_EXPIRY: '300000' //reset password link expiry 5mins,
    MAIL_HOST:"smtp.gmail.com",
    MAIL_PORT:"587",

    MAIL_USER:"<mail id used to generate below password>",
    MAIL_PASSWORD:"<generated email password>",
    MAIL_FROM:"<same as MAIL_USER>",
    ADMIN_EMAIL: "<dummy admin email of your choice>",
    ADMIN_PASSWORD: "<admin email password string of your choice>",
}
```

This should start the server, database and populate dummy data in the database to get started.


## Community Support

For general help using Saleswiz, refer to the below discussion
- [Github](https://github.com/apiwizlabs/saleswiz/discussions) - For bug reports, help, feature requests


## Contributing
All code contributions, including those of people having commit access, must go through a pull request and be approved by a maintaner before being merged. This is to ensure a proper review of all the code.

Kindly read our [Contributing Guide](../CONTRIBUTING.md) to familiarize yourself with Saleswiz's development process, how to suggest bug fixes and improvements, and the steps for building and testing your changes.

## Security

For security issues, kindly email us to security@apiwiz.com instead of posting a public issue on Github

## Follow Us
Join our growing community! Checkout out our official [Blog](https://www.apiwiz.io/resources/blogs). Follow us on [Twitter](https://twitter.com/getapiwiz), [Linkedin](https://www.linkedin.com/company/apiwizio/)


## Thanks to all Contributors 🙏🏼
<a href="https://github.com/apiwizlabs/saleswiz/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=apiwizlabs/saleswiz&max=400&columns=20" />
<a>

<!-- The above picture will be visible once made public -->