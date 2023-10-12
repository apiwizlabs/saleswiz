 const config = require('../config')

const transportObject = {
    host: config.MAIL_HOST,
    port: config.MAIL_PORT,
    secure: false,
    auth: {
        user: config.MAIL_USER,
        pass: config.MAIL_PASSWORD
    }
  }

  const dealNameLabel = "Deal Name";
  const dealStagesLabel = "Select Stage";
  const customerNameLabel = "Customer Name";
  const contactNameLabel = "Contact Name";

module.exports = {transportObject, dealNameLabel, customerNameLabel, contactNameLabel, dealStagesLabel}