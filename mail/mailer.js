const nodemailer = require("nodemailer");
const fs = require('fs');

async function mail(message) {
  let testAccount = await nodemailer.createTestAccount();
  let transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: 'advisstoree@gmail.com', 
      pass: 'offctpfvjpnxxino'
    },
  });
  let info = await transporter.sendMail({
    from: '"Advis Store" dev.traceinc@gmail.com',
    to: message.email,
    subject: message.title,
    text: message.text,
    html: message.content,
    /*attachments: [
        {
            filename: 'document.pdf',
            contentType: 'application/pdf'
        }]*/
  });
  return true;
}
module.exports = mail;